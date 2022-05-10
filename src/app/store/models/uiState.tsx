/* eslint-disable import/prefer-default-export */
import { createModel } from '@rematch/core';
import { StorageType, StorageProviderType, ApiDataType } from '@/types/api';
import { track } from '@/utils/analytics';
import type { RootModel } from '@/types/RootModel';
import fetchChangelog from '@/utils/storyblok';
import { NodeTokenRefMap } from '@/types/NodeTokenRefMap';
import { postToFigma } from '@/plugin/notifiers';
import { MessageToPluginTypes } from '@/types/messages';
import { SingleToken } from '@/types/tokens';
import { SelectionGroup, StoryblokStory } from '@/types';
import { Tabs } from '@/constants/Tabs';
import { FeatureFlags } from '@/utils/featureFlags';

type DisplayType = 'GRID' | 'LIST';

type SelectionValue = NodeTokenRefMap;

export type EditTokenObject = SingleToken<true, {
  initialName: string;
  path: string;
  isPristine: boolean;
  explainer?: string;
  property: string;
  // @TODO get rid of thse object types
  schema?: object;
  optionsSchema: object;
  options: object;
}>;

export type ConfirmProps = {
  show?: boolean;
  text?: string;
  description?: React.ReactNode;
  choices?: { key: string; label: string; enabled?: boolean, unique?: boolean }[];
  confirmAction?: string;
  cancelAction?: string;
  input?: {
    type: 'text';
    placeholder: string;
  };
};

export type AddJobTasksPayload = {
  name: string;
  count: number;
  expectedTimePerTask?: number;
};

export type CompleteJobTasksPayload = {
  name: string;
  count: number;
  timePerTask?: number;
};

export type BackgroundJob = {
  name: string;
  isInfinite?: boolean;
  timePerTask?: number;
  completedTasks?: number;
  totalTasks?: number;
};
export interface UIState {
  backgroundJobs: BackgroundJob[]
  selectionValues: SelectionGroup[];
  mainNodeSelectionValues: SelectionValue
  displayType: DisplayType;
  disabled: boolean;
  activeTab: Tabs;
  projectURL: string;
  storageType: StorageType;
  api: ApiDataType;
  apiProviders: ApiDataType[];
  localApiState: ApiDataType;
  lastUpdatedAt: Date | null;
  changelog: StoryblokStory['content'][];
  lastOpened: number | null;
  editToken: EditTokenObject | null;
  showEditForm: boolean;
  tokenFilter: string;
  confirmState: ConfirmProps;
  showPushDialog: string | false;
  showEmptyGroups: boolean;
  collapsed: boolean;
  selectedLayers: number;
  featureFlags: FeatureFlags
  manageThemesModalOpen: boolean
}

const defaultConfirmState: ConfirmProps = {
  show: false,
  text: '',
  description: '',
  choices: undefined,
  confirmAction: 'Yes',
  cancelAction: 'Cancel',
  input: undefined,
};

export const uiState = createModel<RootModel>()({
  state: {
    selectionValues: [] as SelectionGroup[],
    mainNodeSelectionValues: {} as SelectionValue,
    disabled: false,
    displayType: 'GRID',
    backgroundJobs: [],
    activeTab: Tabs.LOADING,
    projectURL: '',
    storageType: {
      provider: StorageProviderType.LOCAL,
    },
    api: null,
    apiProviders: [],
    localApiState: {
      provider: StorageProviderType.LOCAL,
      new: false,
    },
    lastUpdatedAt: null,
    changelog: [],
    lastOpened: '',
    editToken: null,
    showEditForm: false,
    tokenFilter: '',
    tokenFilterVisible: false,
    confirmState: defaultConfirmState,
    showPushDialog: false,
    showEmptyGroups: true,
    collapsed: false,
    selectedLayers: 0,
    featureFlags: {},
    manageThemesModalOpen: false,
  } as unknown as UIState,
  reducers: {
    setShowPushDialog: (state, data: string | false) => ({
      ...state,
      showPushDialog: data,
    }),
    setShowConfirm: (
      state,
      data: {
        text: string;
        description?: string;
        choices: { key: string; label: string; enabled?: boolean; unique?: boolean }[];
        confirmAction?: string;
        cancelAction?: string;
        input?: {
          type: 'text';
          placeholder: string;
        };
      },
    ) => ({
      ...state,
      confirmState: {
        show: true,
        text: data.text,
        description: data.description,
        choices: data.choices,
        confirmAction: data.confirmAction || defaultConfirmState.confirmAction,
        cancelAction: data.cancelAction || defaultConfirmState.cancelAction,
        input: data.input,
      },
    }),
    setSelectedLayers: (state, data: number) => ({
      ...state,
      selectedLayers: data,
    }),
    setHideConfirm: (state) => ({
      ...state,
      confirmState: defaultConfirmState,
    }),
    setDisabled: (state, data: boolean) => ({
      ...state,
      disabled: data,
    }),
    setEditToken: (state, data: EditTokenObject) => ({
      ...state,
      editToken: data,
    }),
    setShowEditForm: (state, data: boolean) => ({
      ...state,
      showEditForm: data,
    }),
    setDisplayType: (state, data: DisplayType) => {
      track('setDisplayType', { type: data });

      return {
        ...state,
        displayType: data,
      };
    },
    setSelectionValues: (state, data: SelectionGroup[]) => ({
      ...state,
      selectionValues: data,
    }),
    setMainNodeSelectionValues: (state, data: SelectionValue) => ({
      ...state,
      mainNodeSelectionValues: data,
    }),
    resetSelectionValues: (state) => ({
      ...state,
      selectionValues: [] as SelectionGroup[],
    }),
    startJob(state, job: BackgroundJob) {
      return {
        ...state,
        backgroundJobs: [...state.backgroundJobs, { ...job }],
      };
    },
    completeJob(state, name: string) {
      return {
        ...state,
        backgroundJobs: state.backgroundJobs.filter((job) => (
          job.name !== name
        )),
      };
    },
    clearJobs(state) {
      return {
        ...state,
        backgroundJobs: [],
      };
    },
    setActiveTab(state, payload: Tabs) {
      return {
        ...state,
        activeTab: payload,
      };
    },
    setProjectURL(state, payload: string) {
      return {
        ...state,
        projectURL: payload,
      };
    },
    setStorage(state, payload: StorageType) {
      return {
        ...state,
        storageType: payload,
      };
    },
    setApiData(state, payload: ApiDataType) {
      return {
        ...state,
        api: payload,
      };
    },
    setLocalApiState(state, payload: ApiDataType) {
      return {
        ...state,
        localApiState: payload,
      };
    },
    setAPIProviders(state, payload: ApiDataType[]) {
      return {
        ...state,
        apiProviders: payload,
      };
    },
    setChangelog(state, payload: StoryblokStory['content'][]) {
      return {
        ...state,
        changelog: payload,
      };
    },
    setLastOpened(state, payload: number) {
      return {
        ...state,
        lastOpened: payload,
      };
    },
    setTokenFilter(state, payload: string) {
      return {
        ...state,
        tokenFilter: payload,
      };
    },
    toggleShowEmptyGroups(state, payload: boolean | null) {
      return {
        ...state,
        showEmptyGroups: payload == null ? !state.showEmptyGroups : payload,
      };
    },
    toggleCollapsed(state) {
      return {
        ...state,
        collapsed: !state.collapsed,
      };
    },
    setFeatureFlags(state, payload: FeatureFlags) {
      return {
        ...state,
        featureFlags: payload,
      };
    },
    addJobTasks(state, payload: AddJobTasksPayload) {
      return {
        ...state,
        backgroundJobs: state.backgroundJobs.map((job) => {
          if (job.name === payload.name) {
            return {
              ...job,
              ...(payload.expectedTimePerTask ? {
                timePerTask: payload.expectedTimePerTask,
              } : {}),
              completedTasks: job.completedTasks ?? 0,
              totalTasks: (job.totalTasks ?? 0) + payload.count,
            };
          }
          return job;
        }),
      };
    },
    completeJobTasks(state, payload: CompleteJobTasksPayload) {
      return {
        ...state,
        backgroundJobs: state.backgroundJobs.map((job) => {
          if (job.name === payload.name) {
            const totalCompletedTasks = (job.completedTasks ?? 0) + payload.count;
            return {
              ...job,
              timePerTask: payload.timePerTask ?? job.timePerTask,
              completedTasks: totalCompletedTasks,
              totalTasks: (job.totalTasks ?? totalCompletedTasks),
            };
          }
          return job;
        }),
      };
    },
    setManageThemesModalOpen(state, open: boolean) {
      return {
        ...state,
        manageThemesModalOpen: open,
      };
    },
  },
  effects: (dispatch) => ({
    setLastOpened: (payload) => {
      fetchChangelog(payload, (result) => {
        dispatch.uiState.setChangelog(result);
      });
    },
    setActiveTab: (payload: Tabs) => {
      const requiresSelectionValues = payload === Tabs.INSPECTOR;

      postToFigma({
        type: MessageToPluginTypes.CHANGED_TABS,
        requiresSelectionValues,
      });
    },
    toggleShowEmptyGroups(payload: null | boolean, rootState) {
      postToFigma({
        type: MessageToPluginTypes.SET_SHOW_EMPTY_GROUPS,
        showEmptyGroups: payload == null ? rootState.uiState.showEmptyGroups : payload,
      });
    },
  }),
});
