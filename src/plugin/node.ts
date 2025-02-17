import omit from 'just-omit';
import store from './store';
import setValuesOnNode from './setValuesOnNode';
import { ContextObject, StorageProviderType, StorageType } from '../types/api';
import { NodeTokenRefMap } from '@/types/NodeTokenRefMap';
import { NodeManagerNode } from './NodeManager';
import { UpdateNodesSettings } from '@/types/UpdateNodesSettings';
import { SharedPluginDataKeys } from '@/constants/SharedPluginDataKeys';
import { tokensSharedDataHandler } from './SharedDataHandler';
import { postToUI } from './notifiers';
import { MessageFromPluginTypes } from '@/types/messages';
import { BackgroundJobs } from '@/constants/BackgroundJobs';
import { defaultWorker } from './Worker';
import { getAllFigmaStyleMaps } from '@/utils/getAllFigmaStyleMaps';
import { ProgressTracker } from './ProgressTracker';
import { AnyTokenList, AnyTokenSet, TokenStore } from '@/types/tokens';
import { isSingleToken } from '@/utils/is';
import { ThemeObjectsList } from '@/types';
import { attemptOrFallback } from '@/utils/attemptOrFallback';

// @TODO fix typings

export function returnValueToLookFor(key: string) {
  switch (key) {
    case 'tokenName':
      return 'name';
    case 'description':
      return 'description';
    case 'tokenValue':
      return 'rawValue';
    case 'value':
      return 'value';
    default:
      return 'value';
  }
}

// @TOOD fix object typing
export function mapValuesToTokens(tokens: Map<string, AnyTokenList[number]>, values: NodeTokenRefMap): object {
  const mappedValues = Object.entries(values).reduce((acc, [key, tokenOnNode]) => {
    const resolvedToken = tokens.get(tokenOnNode);
    if (!resolvedToken) return acc;

    acc[key] = isSingleToken(resolvedToken) ? resolvedToken[returnValueToLookFor(key)] : resolvedToken;
    return acc;
  }, {});
  return mappedValues;
}

export function getTokenData(): {
  values: TokenStore['values'];
  themes: ThemeObjectsList
  activeTheme: string | null
  updatedAt: string;
  version: string;
} | null {
  try {
    const values = tokensSharedDataHandler.get(figma.root, SharedPluginDataKeys.tokens.values, (value) => (
      attemptOrFallback<Record<string, AnyTokenSet>>(() => (value ? JSON.parse(value) : {}), {})
    ));
    const themes = tokensSharedDataHandler.get(figma.root, SharedPluginDataKeys.tokens.themes, (value) => (
      attemptOrFallback<ThemeObjectsList>(() => {
        const parsedValue = (value ? JSON.parse(value) : []);
        return Array.isArray(parsedValue) ? parsedValue : [];
      }, [])
    ));
    const activeTheme = tokensSharedDataHandler.get(figma.root, SharedPluginDataKeys.tokens.activeTheme, (value) => (
      value || null
    ));
    const version = tokensSharedDataHandler.get(figma.root, SharedPluginDataKeys.tokens.version);
    const updatedAt = tokensSharedDataHandler.get(figma.root, SharedPluginDataKeys.tokens.updatedAt);

    if (Object.keys(values).length > 0) {
      const tokenObject = Object.entries(values).reduce((acc, [key, groupValues]) => {
        acc[key] = typeof groupValues === 'string' ? JSON.parse(groupValues) : groupValues;
        return acc;
      }, {});
      return {
        values: tokenObject as TokenStore['values'],
        themes,
        activeTheme,
        updatedAt,
        version,
      };
    }
  } catch (e) {
    console.log('Error reading tokens', e);
  }
  return null;
}

// set storage type (i.e. local or some remote provider)
export function saveStorageType(context: ContextObject) {
  // remove secret
  const storageToSave = omit(context, ['secret']);
  tokensSharedDataHandler.set(figma.root, SharedPluginDataKeys.tokens.storageType, JSON.stringify(storageToSave));
}

export function getSavedStorageType(): StorageType {
  const values = tokensSharedDataHandler.get(figma.root, SharedPluginDataKeys.tokens.storageType);

  if (values) {
    const context = JSON.parse(values);
    return context;
  }
  return { provider: StorageProviderType.LOCAL };
}

export function goToNode(id: string) {
  const node = figma.getNodeById(id);
  if (node) {
    figma.currentPage.selection = [node];
    figma.viewport.scrollAndZoomIntoView([node]);
  }
}

export function selectNodes(ids: string[]) {
  const nodes = ids.map(figma.getNodeById);
  figma.currentPage.selection = nodes;
}

export async function updateNodes(
  entries: readonly NodeManagerNode[],
  tokens: Map<string, AnyTokenList[number]>,
  settings?: UpdateNodesSettings,
) {
  const { ignoreFirstPartForStyles } = settings ?? {};
  const figmaStyleMaps = getAllFigmaStyleMaps();
  postToUI({
    type: MessageFromPluginTypes.START_JOB,
    job: {
      name: BackgroundJobs.PLUGIN_UPDATENODES,
      timePerTask: 2,
      completedTasks: 0,
      totalTasks: entries.length,
    },
  });

  const tracker = new ProgressTracker(BackgroundJobs.PLUGIN_UPDATENODES);
  const promises: Set<Promise<void>> = new Set();
  const returnedValues: Set<NodeTokenRefMap> = new Set();
  entries.forEach((entry) => {
    promises.add(
      defaultWorker.schedule(async () => {
        try {
          if (entry.tokens) {
            const mappedValues = mapValuesToTokens(tokens, entry.tokens);

            setValuesOnNode(entry.node, mappedValues, entry.tokens, figmaStyleMaps, ignoreFirstPartForStyles);
            store.successfulNodes.add(entry.node);
            returnedValues.add(entry.tokens);
          }
        } catch (e) {
          console.log('got error', e);
        }

        tracker.next();
        tracker.reportIfNecessary();
      }),
    );
  });
  await Promise.all(promises);

  postToUI({
    type: MessageFromPluginTypes.COMPLETE_JOB,
    name: BackgroundJobs.PLUGIN_UPDATENODES,
  });

  if (returnedValues.size) {
    return returnedValues[0];
  }

  return {};
}
