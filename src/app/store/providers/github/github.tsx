import { useDispatch, useSelector } from 'react-redux';
import { useCallback, useMemo } from 'react';
import { useFlags } from 'launchdarkly-react-client-sdk';
import { LDProps } from 'launchdarkly-react-client-sdk/lib/withLDConsumer';
import { Dispatch } from '@/app/store';
import { MessageToPluginTypes } from '@/types/messages';
import useConfirm from '@/app/hooks/useConfirm';
import usePushDialog from '@/app/hooks/usePushDialog';
import { ContextObject } from '@/types/api';
import { notifyToUI, postToFigma } from '@/plugin/notifiers';
import {
  localApiStateSelector, themesListSelector, tokensSelector,
} from '@/selectors';
import { GithubTokenStorage } from '@/storage/GithubTokenStorage';
import { isEqual } from '@/utils/isEqual';
import { RemoteTokenStorageData } from '@/storage/RemoteTokenStorage';
import { GitStorageMetadata } from '@/storage/GitTokenStorage';

export function useGitHub() {
  const tokens = useSelector(tokensSelector);
  const themes = useSelector(themesListSelector);
  const localApiState = useSelector(localApiStateSelector);
  const { multiFileSync } = useFlags();
  const dispatch = useDispatch<Dispatch>();
  const { confirm } = useConfirm();
  const { pushDialog } = usePushDialog();

  const storageClientFactory = useCallback((context: ContextObject, owner?: string, repo?: string) => {
    const splitContextId = context.id.split('/');
    const storageClient = new GithubTokenStorage(context.secret, owner ?? splitContextId[0], repo ?? splitContextId[1], context.baseUrl ?? '');
    if (context.filePath) storageClient.changePath(context.filePath);
    if (context.branch) storageClient.selectBranch(context.branch);
    if (multiFileSync) storageClient.enableMultiFile();
    return storageClient;
  }, [multiFileSync]);

  const askUserIfPull = useCallback(async () => {
    const confirmResult = await confirm({
      text: 'Pull from GitHub?',
      description: 'Your repo already contains tokens, do you want to pull these now?',
    });
    if (confirmResult === false) return false;
    return confirmResult.result;
  }, [confirm]);

  const pushTokensToGitHub = useCallback(async (context: ContextObject): Promise<RemoteTokenStorageData<GitStorageMetadata> | null> => {
    const storage = storageClientFactory(context);
    const content = await storage.retrieve();

    if (content) {
      if (
        content
        && isEqual(content.tokens, tokens)
        && isEqual(content.themes, themes)
      ) {
        notifyToUI('Nothing to commit');
        return {
          tokens,
          themes,
          metadata: {},
        };
      }
    }

    dispatch.uiState.setLocalApiState({ ...context });

    const pushSettings = await pushDialog();
    if (pushSettings) {
      const { commitMessage, customBranch } = pushSettings;
      try {
        if (customBranch) storage.selectBranch(customBranch);
        await storage.save({
          themes,
          tokens,
          metadata: { commitMessage },
        });
        dispatch.uiState.setLocalApiState({ ...localApiState, branch: customBranch });
        dispatch.uiState.setApiData({ ...context, branch: customBranch });
        dispatch.tokenState.setLastSyncedState(JSON.stringify([tokens, themes], null, 2));
        dispatch.tokenState.setTokenData({
          values: tokens,
          themes,
        });
        pushDialog('success');
        return {
          tokens,
          themes,
          metadata: { commitMessage },
        };
      } catch (e) {
        console.log('Error pushing to GitHub', e);
      }
    }

    return {
      tokens,
      themes,
      metadata: {},
    };
  }, [
    dispatch,
    storageClientFactory,
    themes,
    tokens,
    pushDialog,
    localApiState,
  ]);

  const checkAndSetAccess = useCallback(async ({ context, owner, repo }: { context: ContextObject; owner: string; repo: string }) => {
    const storage = storageClientFactory(context, owner, repo);
    const hasWriteAccess = await storage.canWrite();
    dispatch.tokenState.setEditProhibited(!hasWriteAccess);
  }, [dispatch, storageClientFactory]);

  const pullTokensFromGitHub = useCallback(async (context: ContextObject, receivedFeatureFlags?: LDProps['flags']) => {
    const storage = storageClientFactory(context);
    if (receivedFeatureFlags?.multiFileSync) storage.enableMultiFile();

    const [owner, repo] = context.id.split('/');

    await checkAndSetAccess({ context, owner, repo });

    try {
      const content = await storage.retrieve();

      if (content) {
        return content;
      }
    } catch (e) {
      console.log('Error', e);
    }
    return null;
  }, [
    checkAndSetAccess,
    storageClientFactory,
  ]);

  // Function to initially check auth and sync tokens with GitHub
  const syncTokensWithGitHub = useCallback(async (context: ContextObject): Promise<RemoteTokenStorageData<GitStorageMetadata> | null> => {
    try {
      const storage = storageClientFactory(context);
      const hasBranches = await storage.fetchBranches();
      if (!hasBranches || !hasBranches.length) {
        return null;
      }
      const content = await storage.retrieve();
      if (content) {
        if (
          !isEqual(content.tokens, tokens)
          || !isEqual(content.themes, themes)
        ) {
          const userDecision = await askUserIfPull();
          if (userDecision) {
            dispatch.tokenState.setLastSyncedState(JSON.stringify([content.tokens, content.themes], null, 2));
            dispatch.tokenState.setTokenData({
              values: content.tokens,
              themes: content.themes,
            });
            notifyToUI('Pulled tokens from GitHub');
          }
        }
        return content;
      }
      return await pushTokensToGitHub(context);
    } catch (e) {
      notifyToUI('Error syncing with GitHub, check credentials', { error: true });
      console.log('Error', e);
      return null;
    }
  }, [
    askUserIfPull,
    dispatch,
    pushTokensToGitHub,
    storageClientFactory,
    themes,
    tokens,
  ]);

  const addNewGitHubCredentials = useCallback(async (context: ContextObject): Promise<RemoteTokenStorageData<GitStorageMetadata> | null> => {
    const data = await syncTokensWithGitHub(context);
    if (data) {
      postToFigma({
        type: MessageToPluginTypes.CREDENTIALS,
        ...context,
      });
      if (data?.tokens) {
        dispatch.tokenState.setLastSyncedState(JSON.stringify([data.tokens, data.themes], null, 2));
        dispatch.tokenState.setTokenData({
          values: data.tokens,
          themes: data.themes,
        });
      } else {
        notifyToUI('No tokens stored on remote');
      }
    } else {
      return null;
    }
    return {
      tokens: data.tokens ?? tokens,
      themes: data.themes ?? themes,
      metadata: {},
    };
  }, [dispatch, tokens, themes, syncTokensWithGitHub]);

  const fetchGithubBranches = useCallback(async (context: ContextObject) => {
    const storage = storageClientFactory(context);
    return storage.fetchBranches();
  }, [storageClientFactory]);

  const createGithubBranch = useCallback((context: ContextObject, newBranch: string, source?: string) => {
    const storage = storageClientFactory(context);
    return storage.createBranch(newBranch, source);
  }, [storageClientFactory]);

  return useMemo(() => ({
    addNewGitHubCredentials,
    syncTokensWithGitHub,
    pullTokensFromGitHub,
    pushTokensToGitHub,
    fetchGithubBranches,
    createGithubBranch,
  }), [
    addNewGitHubCredentials,
    syncTokensWithGitHub,
    pullTokensFromGitHub,
    pushTokensToGitHub,
    fetchGithubBranches,
    createGithubBranch,
  ]);
}
