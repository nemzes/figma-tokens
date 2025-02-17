import { SettingsState } from '@/app/store/models/settings';
import { Properties } from '@/constants/Properties';
import type { BackgroundJob } from '@/app/store/models/uiState';
import {
  ApiDataType, ContextObject, StorageProviderType, StorageType,
} from './api';
import { NodeTokenRefMap } from './NodeTokenRefMap';
import { UpdateMode } from './state';
import { SelectionGroup } from './SelectionGroup';
import { SelectionValue } from './SelectionValue';
import { AnyTokenList, AnyTokenSet, TokenStore } from './tokens';
import { PullStyleOptions } from './PullStylesOptions';
import { UsedTokenSetsMap } from './UsedTokenSetsMap';
import { TokenTypes } from '@/constants/TokenTypes';
import { ThemeObjectsList } from './ThemeObjectsList';
import { NodeInfo } from './NodeInfo';

export enum MessageFromPluginTypes {
  SELECTION = 'selection',
  NO_SELECTION = 'noselection',
  REMOTE_COMPONENTS = 'remotecomponents',
  TOKEN_VALUES = 'tokenvalues',
  NO_TOKEN_VALUES = 'notokenvalues',
  STYLES = 'styles',
  RECEIVED_STORAGE_TYPE = 'receivedStorageType',
  API_CREDENTIALS = 'apiCredentials',
  API_PROVIDERS = 'apiProviders',
  USER_ID = 'userId',
  RECEIVED_LAST_OPENED = 'receivedLastOpened',
  UI_SETTINGS = 'uiSettings',
  SHOW_EMPTY_GROUPS = 'show_empty_groups',
  START_JOB = 'start_job',
  COMPLETE_JOB = 'complete_job',
  CLEAR_JOBS = 'clear_jobs',
  ADD_JOB_TASKS = 'add_job_tasks',
  COMPLETE_JOB_TASKS = 'complete_job_tasks',
  LICENSE_KEY = 'license_key',
}

export enum MessageToPluginTypes {
  INITIATE = 'initiate',
  REMOVE_SINGLE_CREDENTIAL = 'remove-single-credential',
  GO_TO_NODE = 'gotonode',
  CREDENTIALS = 'credentials',
  UPDATE = 'update',
  CREATE_STYLES = 'create-styles',
  SET_NODE_DATA = 'set-node-data',
  PULL_STYLES = 'pull-styles',
  SET_STORAGE_TYPE = 'set-storage-type',
  NOTIFY = 'notify',
  SET_UI = 'set_ui',
  SET_SHOW_EMPTY_GROUPS = 'set_show_empty_groups',
  RESIZE_WINDOW = 'resize_window',
  CANCEL_OPERATION = 'cancel_operation',
  CREATE_ANNOTATION = 'create-annotation',
  REMAP_TOKENS = 'remap-tokens',
  REMOVE_TOKENS_BY_VALUE = 'remove-tokens-by-value',
  CHANGED_TABS = 'changed-tabs',
  SELECT_NODES = 'select-nodes',
  SET_LICENSE_KEY = 'set-license-key',
  GET_API_CREDENTIALS = 'get-api-credentials',
}

export type NoSelectionFromPluginMessage = { type: MessageFromPluginTypes.NO_SELECTION };
export type SelectionFromPluginMessage = {
  type: MessageFromPluginTypes.SELECTION;
  selectionValues: SelectionGroup[];
  mainNodeSelectionValues: SelectionValue[];
  selectedNodes: number;
};
export type UiSettingsFromPluginMessage = {
  type: MessageFromPluginTypes.UI_SETTINGS;
  settings: {
    uiWindow: {
      width: number;
      height: number;
      isMinimized: boolean;
    };
    updateMode: UpdateMode;
    updateRemote: boolean;
    updateOnChange: boolean;
    updateStyles: boolean;
    ignoreFirstPartForStyles: boolean;
    inspectDeep: boolean;
  };
};

export type ShowEmptyGroupsFromPluginMessage = {
  type: MessageFromPluginTypes.SHOW_EMPTY_GROUPS;
  showEmptyGroups: boolean;
};
export type RemoteCommentsFromPluginMessage = {
  type: MessageFromPluginTypes.REMOTE_COMPONENTS;
};
export type TokenValuesFromPluginMessage = {
  type: MessageFromPluginTypes.TOKEN_VALUES;
  values: TokenStore;
};
export type NoTokenValuesFromPluginMessage = {
  type: MessageFromPluginTypes.NO_TOKEN_VALUES;
};
export type ReceivedStorageTypeFromPluginMessage = {
  type: MessageFromPluginTypes.RECEIVED_STORAGE_TYPE;
  storageType: StorageType;
};
export type ApiProvidersFromPluginMessage = {
  type: MessageFromPluginTypes.API_PROVIDERS;
  providers: ApiDataType[];
};
export type StylesFromPluginMessage = {
  type: MessageFromPluginTypes.STYLES;
  values?: any;
};
export type UserIdFromPluginMessage = {
  type: MessageFromPluginTypes.USER_ID;
  user: { userId: string; figmaId: string | null; name: string };
};
export type ReceivedLastOpenedFromPluginMessage = {
  type: MessageFromPluginTypes.RECEIVED_LAST_OPENED;
  lastOpened: number;
};
export type StartJobFromPluginMessage = {
  type: MessageFromPluginTypes.START_JOB;
  job: BackgroundJob;
};
export type CompleteJobFromPluginMessage = {
  type: MessageFromPluginTypes.COMPLETE_JOB;
  name: string;
};
export type ClearJobsFromPluginMessage = {
  type: MessageFromPluginTypes.CLEAR_JOBS;
};
export type AddJobTasksFromPluginMessage = {
  type: MessageFromPluginTypes.ADD_JOB_TASKS;
  name: string;
  count: number;
  expectedTimePerTask?: number;
};
export type CompleteJobTasksFromPluginMessage = {
  type: MessageFromPluginTypes.COMPLETE_JOB_TASKS;
  name: string;
  count: number;
  timePerTask?: number;
};
export type ApiCredentialsFromPluginMessage = {
  type: MessageFromPluginTypes.API_CREDENTIALS;
  status: boolean;
  credentials: ApiDataType & {
    internalId?: string;
  };
  usedTokenSet?: UsedTokenSetsMap | null;
};

export type LicenseKeyFromPluginMessage = {
  type: MessageFromPluginTypes.LICENSE_KEY;
  licenseKey: string;
};
export type PostToUIMessage =
  | NoSelectionFromPluginMessage
  | SelectionFromPluginMessage
  | UiSettingsFromPluginMessage
  | ShowEmptyGroupsFromPluginMessage
  | RemoteCommentsFromPluginMessage
  | TokenValuesFromPluginMessage
  | NoTokenValuesFromPluginMessage
  | ReceivedStorageTypeFromPluginMessage
  | ApiProvidersFromPluginMessage
  | StylesFromPluginMessage
  | UserIdFromPluginMessage
  | ReceivedLastOpenedFromPluginMessage
  | StartJobFromPluginMessage
  | CompleteJobFromPluginMessage
  | ClearJobsFromPluginMessage
  | AddJobTasksFromPluginMessage
  | CompleteJobTasksFromPluginMessage
  | ApiCredentialsFromPluginMessage
  | LicenseKeyFromPluginMessage;

export type InitiateToPluginMessage = { type: MessageToPluginTypes.INITIATE };
export type RemoveSingleCredentialToPluginMessage = {
  type: MessageToPluginTypes.REMOVE_SINGLE_CREDENTIAL;
  context: ContextObject;
};
export type GoToNodeToPluginMessage = {
  type: MessageToPluginTypes.GO_TO_NODE;
  id: string;
};
export type CredentialsToPluginMessage = {
  type: MessageToPluginTypes.CREDENTIALS;
  id: string;
  name: string;
  secret: string;
  provider: StorageProviderType;
};
export type UpdateToPluginMessage = {
  type: MessageToPluginTypes.UPDATE;
  tokenValues: AnyTokenSet;
  tokens: AnyTokenList | null;
  themes: ThemeObjectsList
  updatedAt: string;
  settings: SettingsState;
  usedTokenSet: UsedTokenSetsMap;
  activeTheme: string | null;
  checkForChanges: string
};
export type CreateStylesToPluginMessage = {
  type: MessageToPluginTypes.CREATE_STYLES;
  tokens: AnyTokenList;
  settings: SettingsState;
};
export type SetNodeDataToPluginMessage = {
  type: MessageToPluginTypes.SET_NODE_DATA;
  values: NodeTokenRefMap;
  tokens: AnyTokenList;
  settings: SettingsState;
};
export type PullStylesToPluginMessage = {
  type: MessageToPluginTypes.PULL_STYLES;
  styleTypes: PullStyleOptions;
};
export type SetStorageTypeToPluginMessage = {
  type: MessageToPluginTypes.SET_STORAGE_TYPE;
  storageType: ContextObject;
};
export type NotifyToPluginMessage = {
  type: MessageToPluginTypes.NOTIFY;
  msg: string;
  opts: NotificationOptions;
};
export type SetUiToPluginMessage = SettingsState & {
  type: MessageToPluginTypes.SET_UI;
};
export type SetShowEmptyGroupsPluginMessage = {
  type: MessageToPluginTypes.SET_SHOW_EMPTY_GROUPS;
  showEmptyGroups: boolean;
};
export type ResizeWindowToPluginMessage = {
  type: MessageToPluginTypes.RESIZE_WINDOW;
  width: number;
  height: number;
};
export type CancelOperationToPluginMessage = {
  type: MessageToPluginTypes.CANCEL_OPERATION;
};
export type CreateAnnotationToPluginMessage = {
  type: MessageToPluginTypes.CREATE_ANNOTATION;
  tokens: object;
  direction: string;
};
export type RemapTokensToPluginMessage = {
  type: MessageToPluginTypes.REMAP_TOKENS;
  oldName: string;
  newName: string;
  updateMode: UpdateMode;
  category?: Properties | TokenTypes;
};
export type RemoveTokensByValueToPluginMessage = {
  type: MessageToPluginTypes.REMOVE_TOKENS_BY_VALUE;
  tokensToRemove: { nodes: NodeInfo[]; property: Properties }[];
};
export type ChangedTabsToPluginMessage = {
  type: MessageToPluginTypes.CHANGED_TABS;
  requiresSelectionValues: boolean;
};

export type SelectNodesPluginMessage = {
  type: MessageToPluginTypes.SELECT_NODES;
  ids: string[];
};

export type SetLicenseKeyPluginMessage = {
  type: MessageToPluginTypes.SET_LICENSE_KEY;
  licenseKey: string | null;
};

export type GetApiCredentialsMessage = {
  type: MessageToPluginTypes.GET_API_CREDENTIALS;
};

export type PostToFigmaMessage =
  | InitiateToPluginMessage
  | RemoveSingleCredentialToPluginMessage
  | GoToNodeToPluginMessage
  | CredentialsToPluginMessage
  | UpdateToPluginMessage
  | CreateStylesToPluginMessage
  | SetNodeDataToPluginMessage
  | PullStylesToPluginMessage
  | SetStorageTypeToPluginMessage
  | NotifyToPluginMessage
  | SetUiToPluginMessage
  | SetShowEmptyGroupsPluginMessage
  | ResizeWindowToPluginMessage
  | CancelOperationToPluginMessage
  | CreateAnnotationToPluginMessage
  | RemapTokensToPluginMessage
  | RemoveTokensByValueToPluginMessage
  | ChangedTabsToPluginMessage
  | SelectNodesPluginMessage
  | SetLicenseKeyPluginMessage
  | GetApiCredentialsMessage;
