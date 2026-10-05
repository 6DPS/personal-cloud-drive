const state = {
  path: "",
  items: [],
  uploadTargetPath: "",
  eventSource: null,
  busy: false,
  draggedItemPath: "",
  selectionMode: false,
  selectedPaths: new Set(),
  lastAnchorKey: "",
  folderCache: new Map(),
  folderListCache: null,
  folderListCacheAt: 0,
  refreshTimer: null,
  pendingRealtimeRefresh: false,
  accessInfoTimer: null,
  accessInfoRefreshQueued: false,
  lastAccessInfoRefreshAt: 0,
  accessInfoController: null,
  accessInfoRequestSeq: 0,
  storageUsageTimer: null,
  storageUsageRefreshQueued: false,
  lastStorageUsageRefreshAt: 0,
  healthTimer: null,
  realtimeRefreshSuppressUntil: 0,
  uploadProgressMax: 0,
  unlockedFolders: new Set(),
  folderPasswordDialog: null,
  dialog: null,
  authMode: "login",
  currentUser: null,
  registrationKeys: [],
  adminUsers: [],
  previewItem: null,
  previewController: null,
  previewRequestSeq: 0,
  folderLoadController: null,
  folderLoadRequestSeq: 0,
  lanSwitching: false,
  searchActive: false,
  searchQuery: "",
  searchRawItems: [],
  searchCategory: "all",
  searchSort: "relevance",
  searchTokens: [],
  aiModeEnabled: false,
  aiWebSearchEnabled: false,
  aiDrawer: {
    mode: "global",
    item: null,
    messages: [],
    model: "reasoner",
    key: "",
    returnTo: null,
    forceGlobal: false,
  },
  currentAiSessionId: null,
  aiConversations: new Map(),
  trashMode: false,
  starredMode: false,
};

const $ = (selector) => document.querySelector(selector);
const SESSION_TOKEN_KEY = "pcd.sessionToken";
const AI_MODE_KEY = "pcd.aiModeEnabled";
let aiDrawerCloseTimer = null;
let aiPromptPressTimer = null;
let aiModeRenderFrame = 0;
const AI_PENDING_CONTEXT_DELAY_MS = 1800;
const AI_PENDING_LONG_DELAY_MS = 8000;
const AI_SEND_ARROW_SVG = '<svg class="send-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg>';
const AI_STOP_SQUARE_SVG = '<svg class="stop-icon" viewBox="0 0 24 24" width="13" height="13" fill="currentColor" aria-hidden="true"><rect x="5" y="5" width="14" height="14" rx="3.5"></rect></svg>';

const starredNavBtn = $("#starredNavBtn");
const sidebarStarredCount = $("#sidebarStarredCount");
const bulkStarBtn = $("#bulkStarBtn");
const recycleBinBtn = $("#recycleBinBtn");
const mySharesBtn = $("#mySharesBtn");

const zipArchiveModal = $("#zipArchiveModal");
const zipArchiveTitle = $("#zipArchiveTitle");
const zipDownloadAllBtn = $("#zipDownloadAllBtn");
const closeZipArchiveBtn = $("#closeZipArchiveBtn");
const zipNavBar = $("#zipNavBar");
const zipBackBtn = $("#zipBackBtn");
const zipBreadcrumb = $("#zipBreadcrumb");
const zipTreeContainer = $("#zipTreeContainer");

const shareModal = $("#shareModal");
const shareModalTitle = $("#shareModalTitle");
const closeShareModalBtn = $("#closeShareModalBtn");
const cancelShareBtn = $("#cancelShareBtn");
const shareItemName = $("#shareItemName");
const shareExpireDays = $("#shareExpireDays");
const sharePasswordInput = $("#sharePasswordInput");
const shareResultPanel = $("#shareResultPanel");
const shareResultLink = $("#shareResultLink");
const sharePublicLink = $("#sharePublicLink");
const shareLanLink = $("#shareLanLink");
const copyPublicLinkBtn = $("#copyPublicLinkBtn");
const copyLanLinkBtn = $("#copyLanLinkBtn");
const copyShareLinkBtn = $("#copyShareLinkBtn");
const shareBatchList = $("#shareBatchList");
const createShareBtn = $("#createShareBtn");
const shareDoneBtn = $("#shareDoneBtn");
const shareActionButtons = $("#shareActionButtons");

const mySharesModal = $("#mySharesModal");
const closeMySharesModalBtn = $("#closeMySharesModalBtn");
const mySharesList = $("#mySharesList");

const previewAiSummarizeBtn = $("#previewAiSummarizeBtn");
const aiDocSummaryModal = $("#aiDocSummaryModal");
const aiDocSummaryTitle = $("#aiDocSummaryTitle");
const closeAiDocSummaryModalBtn = $("#closeAiDocSummaryModalBtn");
const aiDocSummaryBody = $("#aiDocSummaryBody");

const loginView = $("#loginView");
const driveView = $("#driveView");
const loginForm = $("#loginForm");
const loginError = $("#loginError");
const loginSubmitBtn = $("#loginSubmitBtn");
const authModeToggle = $("#authModeToggle");
const forgotPasswordBtn = $("#forgotPasswordBtn");
const username = $("#username");
const password = $("#password");
const registrationKeyField = $("#registrationKeyField");
const registrationKeyInput = $("#registrationKeyInput");
const passwordResetModal = $("#passwordResetModal");
const closePasswordResetModalBtn = $("#closePasswordResetModalBtn");
const cancelPasswordResetBtn = $("#cancelPasswordResetBtn");
const confirmPasswordResetBtn = $("#confirmPasswordResetBtn");
const resetUsernameInput = $("#resetUsernameInput");
const resetRecoveryPasswordInput = $("#resetRecoveryPasswordInput");
const resetNewPasswordInput = $("#resetNewPasswordInput");
const passwordResetError = $("#passwordResetError");
const registrationKeysBtn = $("#registrationKeysBtn");
const registrationKeysModal = $("#registrationKeysModal");
const closeRegistrationKeysModalBtn = $("#closeRegistrationKeysModalBtn");
const generateRegistrationKeyBtn = $("#generateRegistrationKeyBtn");
const refreshRegistrationKeysBtn = $("#refreshRegistrationKeysBtn");
const registrationKeyList = $("#registrationKeyList");
const registrationKeysError = $("#registrationKeysError");
const newRegistrationKeyPanel = $("#newRegistrationKeyPanel");
const newRegistrationKeyValue = $("#newRegistrationKeyValue");
const copyRegistrationKeyBtn = $("#copyRegistrationKeyBtn");
const newKeyQuotaSelect = $("#newKeyQuotaSelect");
const newKeyQuotaStepper = $("#newKeyQuotaStepper");
const newKeyQuotaCustomInput = $("#newKeyQuotaCustomInput");
const newKeyQuotaStepUp = $("#newKeyQuotaStepUp");
const newKeyQuotaStepDown = $("#newKeyQuotaStepDown");

const userQuotasBtn = $("#userQuotasBtn");
const userQuotasModal = $("#userQuotasModal");
const closeUserQuotasModalBtn = $("#closeUserQuotasModalBtn");
const refreshUserQuotasBtn = $("#refreshUserQuotasBtn");
const userQuotaList = $("#userQuotaList");
const userQuotasError = $("#userQuotasError");
const storageMetricLabel = $("#storageMetricLabel");

const userAvatarModal = $("#userAvatarModal");
const closeUserAvatarModalBtn = $("#closeUserAvatarModalBtn");
const avatarModalPreviewImg = $("#avatarModalPreviewImg");
const avatarModalPreviewInitial = $("#avatarModalPreviewInitial");
const userAvatarFileInput = $("#userAvatarFileInput");
const selectAvatarImageBtn = $("#selectAvatarImageBtn");
const resetAvatarDefaultBtn = $("#resetAvatarDefaultBtn");
const saveUserAvatarBtn = $("#saveUserAvatarBtn");
const cancelUserAvatarBtn = $("#cancelUserAvatarBtn");
const userAvatarModalError = $("#userAvatarModalError");
const userAvatarContainer = $("#userAvatarContainer");
const sidebarUserAvatarImg = $("#sidebarUserAvatarImg");

// Popover & 账号个人中心
const sidebarUserDock = $("#sidebarUserDock");
const sidebarUserMenuBtn = $("#sidebarUserMenuBtn");
const userAccountPopover = $("#userAccountPopover");
const popoverAvatarImg = $("#popoverAvatarImg");
const popoverUserInitial = $("#popoverUserInitial");
const popoverUsername = $("#popoverUsername");
const popoverRoleTag = $("#popoverRoleTag");
const popoverChangeAvatarBtn = $("#popoverChangeAvatarBtn");
const popoverSecurityBtn = $("#popoverSecurityBtn");
const popoverLogoutBtn = $("#popoverLogoutBtn");

// 密码与安全设置模态框
const userSecurityModal = $("#userSecurityModal");
const closeUserSecurityModalBtn = $("#closeUserSecurityModalBtn");
const secTabChangeBtn = $("#secTabChangeBtn");
const secTabRecoverBtn = $("#secTabRecoverBtn");
const secTabKeyBtn = $("#secTabKeyBtn");
const secChangeView = $("#secChangeView");
const secRecoverView = $("#secRecoverView");
const secKeyView = $("#secKeyView");
const secViewMyKeyLink = $("#secViewMyKeyLink");
const secKeyGoResetLink = $("#secKeyGoResetLink");
const closeSecKeyViewBtn = $("#closeSecKeyViewBtn");

const secOldPasswordInput = $("#secOldPasswordInput");
const secNewPasswordInput = $("#secNewPasswordInput");
const secConfirmPasswordInput = $("#secConfirmPasswordInput");
const secChangeError = $("#secChangeError");
const confirmSecChangeBtn = $("#confirmSecChangeBtn");
const cancelSecChangeBtn = $("#cancelSecChangeBtn");
const secForgotOldPwdLink = $("#secForgotOldPwdLink");

const secCurrentUsernameText = $("#secCurrentUsernameText");
const secRecoveryKeyInput = $("#secRecoveryKeyInput");
const secRecoverNewPasswordInput = $("#secRecoverNewPasswordInput");
const secRecoverConfirmPasswordInput = $("#secRecoverConfirmPasswordInput");
const secRecoverError = $("#secRecoverError");
const confirmSecRecoverBtn = $("#confirmSecRecoverBtn");
const cancelSecRecoverBtn = $("#cancelSecRecoverBtn");

const secRegenerateKeyBtn = $("#secRegenerateKeyBtn");
const secRecoveryKeyVal = $("#secRecoveryKeyVal");
const secToggleKeyVisibilityBtn = $("#secToggleKeyVisibilityBtn");
const secKeyEyeIcon = $("#secKeyEyeIcon");
const secCopyKeyBtn = $("#secCopyKeyBtn");
const secCopyKeyBtnText = $("#secCopyKeyBtnText");
const secDownloadKeyBtn = $("#secDownloadKeyBtn");

// 注册成功展示恢复密钥模态框
const registerSuccessModal = $("#registerSuccessModal");
const newAccountRecoveryKeyText = $("#newAccountRecoveryKeyText");
const copyNewAccountRecoveryKeyBtn = $("#copyNewAccountRecoveryKeyBtn");
const downloadNewAccountRecoveryKeyBtn = $("#downloadNewAccountRecoveryKeyBtn");
const confirmRegisterSuccessBtn = $("#confirmRegisterSuccessBtn");

// 管理员重置普通用户凭据模态框
const adminResetUserModal = $("#adminResetUserModal");
const closeAdminResetUserModalBtn = $("#closeAdminResetUserModalBtn");
const cancelAdminResetUserModalBtn = $("#cancelAdminResetUserModalBtn");
const adminResetTargetUsername = $("#adminResetTargetUsername");
const adminResetPasswordInput = $("#adminResetPasswordInput");
const adminGenRandomPwdBtn = $("#adminGenRandomPwdBtn");
const adminSubmitNewPwdBtn = $("#adminSubmitNewPwdBtn");
const adminResetUserError = $("#adminResetUserError");

const breadcrumb = $("#breadcrumb");
const statusLine = $("#statusLine");
const storageRoot = $("#storageRoot");
const lanAccessLinks = $("#lanAccessLinks");
const publicAccessLink = $("#publicAccessLink");
const activeClientCount = $("#activeClientCount");
const networkStatus = $("#networkStatus");
const healthStatus = $("#healthStatus");
const fileRows = $("#fileRows");
const emptyState = $("#emptyState");
const fileInput = $("#fileInput");
const folderInput = $("#folderInput");
const dropZone = $("#dropZone");
const backBtn = $("#backBtn");
const currentFolderLabel = $("#currentFolderLabel");
const searchInput = $("#searchInput");
const searchScopeLabel = $("#searchScopeLabel");
const aiModeToggleBtn = $("#aiModeToggleBtn");
const aiGlobalSearchBtn = $("#aiGlobalSearchBtn");
const aiDrawer = $("#aiDrawer");
const aiDrawerBackdrop = $("#aiDrawerBackdrop");
const aiDrawerBackBtn = $("#aiDrawerBackBtn");
const aiHistoryBtn = $("#aiHistoryBtn");
const aiNewChatBtn = $("#aiNewChatBtn");
const aiDrawerCloseBtn = $("#aiDrawerCloseBtn");
const aiDrawerTitle = $("#aiDrawerTitle");
const aiDrawerSubtitle = $("#aiDrawerSubtitle");
const aiModelReasonerBtn = $("#aiModelReasonerBtn");
const aiWebSearchToggleBtn = $("#aiWebSearchToggleBtn");
const aiScopeBtn = $("#aiScopeBtn");
const aiContextCard = $("#aiContextCard");
const aiSuggestionList = $("#aiSuggestionList");
const aiMessages = $("#aiMessages");
const aiPromptForm = $("#aiPromptForm");
const aiPromptInput = $("#aiPromptInput");
const aiPromptHint = $("#aiPromptHint");
const aiPromptSendBtn = $("#aiPromptSendBtn");
const aiHistoryPanel = $("#aiHistoryPanel");
const aiHistoryTitleText = $("#aiHistoryTitleText");
const aiHistoryCount = $("#aiHistoryCount");
const aiHistoryList = $("#aiHistoryList");
const aiClearAllHistoryBtn = $("#aiClearAllHistoryBtn");
const aiCloseHistoryBtn = $("#aiCloseHistoryBtn");
const searchBtn = $("#searchBtn");
const clearSearchBtn = $("#clearSearchBtn");
const searchSummary = $("#searchSummary");
const searchTools = $("#searchTools");
const searchCategoryTabs = $("#searchCategoryTabs");
const searchSort = $("#searchSort");
const folderCount = $("#folderCount");
const fileCount = $("#fileCount");
const storageUsed = $("#storageUsed");
const uploadProgress = $("#uploadProgress");
const uploadProgressText = $("#uploadProgressText");
const uploadProgressPercent = $("#uploadProgressPercent");
const uploadProgressBar = $("#uploadProgressBar");
const uploadModal = $("#uploadModal");
const uploadFolderSelect = $("#uploadFolderSelect");
const closeUploadModalBtn = $("#closeUploadModalBtn");
const cancelUploadTargetBtn = $("#cancelUploadTargetBtn");
const uploadConflictModal = $("#uploadConflictModal");
const closeConflictModalBtn = $("#closeConflictModalBtn");
const conflictEyebrow = $("#conflictEyebrow");
const conflictModalTitle = $("#conflictModalTitle");
const conflictFileNameDesc = $("#conflictFileNameDesc");
const conflictCurrentFileName = $("#conflictCurrentFileName");
const conflictMultiBanner = $("#conflictMultiBanner");
const conflictMultiCounter = $("#conflictMultiCounter");
const conflictMultiPath = $("#conflictMultiPath");
const conflictPrevBtn = $("#conflictPrevBtn");
const conflictNextBtn = $("#conflictNextBtn");
const conflictExistingIcon = $("#conflictExistingIcon");
const conflictExistingName = $("#conflictExistingName");
const conflictExistingSize = $("#conflictExistingSize");
const conflictExistingMtime = $("#conflictExistingMtime");
const conflictIncomingIcon = $("#conflictIncomingIcon");
const conflictIncomingName = $("#conflictIncomingName");
const conflictIncomingSize = $("#conflictIncomingSize");
const conflictIncomingMtime = $("#conflictIncomingMtime");
const conflictReplaceBtn = $("#conflictReplaceBtn");
const conflictReplaceTitle = $("#conflictReplaceTitle");
const conflictReplaceDesc = $("#conflictReplaceDesc");
const conflictKeepBothBtn = $("#conflictKeepBothBtn");
const conflictKeepBothTitle = $("#conflictKeepBothTitle");
const conflictKeepBothDesc = $("#conflictKeepBothDesc");
const conflictSkipBtn = $("#conflictSkipBtn");
const conflictSkipTitle = $("#conflictSkipTitle");
const conflictSkipDesc = $("#conflictSkipDesc");
const conflictApplyAllWrap = $("#conflictApplyAllWrap");
const conflictApplyAllCheck = $("#conflictApplyAllCheck");
const conflictApplyAllText = $("#conflictApplyAllText");
const cancelConflictUploadBtn = $("#cancelConflictUploadBtn");
const chooseFilesBtn = $("#chooseFilesBtn");
const chooseFolderBtn = $("#chooseFolderBtn");
const selectModeBtn = $("#selectModeBtn");
const selectionBar = $("#selectionBar");
const selectionCount = $("#selectionCount");
const normalSelectionActions = $("#normalSelectionActions");
const trashSelectionActions = $("#trashSelectionActions");
const selectAllBtn = $("#selectAllBtn");
const trashSelectAllBtn = $("#trashSelectAllBtn");
const bulkRestoreTrashBtn = $("#bulkRestoreTrashBtn");
const bulkPermanentDeleteBtn = $("#bulkPermanentDeleteBtn");
const clearTrashSelectionBtn = $("#clearTrashSelectionBtn");
const headerSelectAll = $("#headerSelectAll");
const bulkDownloadBtn = $("#bulkDownloadBtn");
const bulkShareBtn = $("#bulkShareBtn");
const bulkCopyBtn = $("#bulkCopyBtn");
const bulkMoveBtn = $("#bulkMoveBtn");
const bulkDeleteBtn = $("#bulkDeleteBtn");
const clearSelectionBtn = $("#clearSelectionBtn");
const bulkMoveModal = $("#bulkMoveModal");
const bulkMoveFolderSelect = $("#bulkMoveFolderSelect");
const closeBulkMoveModalBtn = $("#closeBulkMoveModalBtn");
const cancelBulkMoveBtn = $("#cancelBulkMoveBtn");
const confirmBulkMoveBtn = $("#confirmBulkMoveBtn");
const previewModal = $("#previewModal");
const previewTitle = $("#previewTitle");
const previewBody = $("#previewBody");
const previewCard = previewModal.querySelector(".preview-card");
const previewDownloadLink = $("#previewDownloadLink");
const closePreviewBtn = $("#closePreviewBtn");
const folderPasswordModal = $("#folderPasswordModal");
const folderPasswordEyebrow = $("#folderPasswordEyebrow");
const folderPasswordTitle = $("#folderPasswordTitle");
const folderPasswordDescription = $("#folderPasswordDescription");
const folderAdminPasswordField = $("#folderAdminPasswordField");
const folderAdminPasswordLabel = $("#folderAdminPasswordLabel");
const folderAdminPasswordInput = $("#folderAdminPasswordInput");
const folderCurrentPasswordField = $("#folderCurrentPasswordField");
const folderCurrentPasswordLabel = $("#folderCurrentPasswordLabel");
const folderCurrentPasswordInput = $("#folderCurrentPasswordInput");
const folderNewPasswordField = $("#folderNewPasswordField");
const folderNewPasswordLabel = $("#folderNewPasswordLabel");
const folderNewPasswordInput = $("#folderNewPasswordInput");
const folderPasswordHint = $("#folderPasswordHint");
const folderPasswordError = $("#folderPasswordError");
const confirmFolderPasswordBtn = $("#confirmFolderPasswordBtn");
const resetFolderPasswordBtn = $("#resetFolderPasswordBtn");
const removeFolderPasswordBtn = $("#removeFolderPasswordBtn");
const cancelFolderPasswordBtn = $("#cancelFolderPasswordBtn");
const closeFolderPasswordModalBtn = $("#closeFolderPasswordModalBtn");
const dialogModal = $("#dialogModal");
const dialogEyebrow = $("#dialogEyebrow");
const dialogTitle = $("#dialogTitle");
const dialogDescription = $("#dialogDescription");
const dialogInputField = $("#dialogInputField");
const dialogInputLabel = $("#dialogInputLabel");
const dialogInput = $("#dialogInput");
const dialogSelectField = $("#dialogSelectField");
const dialogSelectLabel = $("#dialogSelectLabel");
const dialogSelect = $("#dialogSelect");
const folderDropdowns = new Map();
const dialogSecondInputField = $("#dialogSecondInputField");
const dialogSecondInputLabel = $("#dialogSecondInputLabel");
const dialogSecondInput = $("#dialogSecondInput");
const dialogError = $("#dialogError");
const confirmDialogBtn = $("#confirmDialogBtn");
const cancelDialogBtn = $("#cancelDialogBtn");
const closeDialogModalBtn = $("#closeDialogModalBtn");
const PUBLIC_CHUNK_HOSTS = new Set([]);
const LAN_DIRECT_UPLOAD_LIMIT = 512 * 1024 * 1024;
const LAN_DIRECT_UPLOAD_FILE_LIMIT = 5000;
const FALLBACK_CHUNK_BYTES = 1 * 1024 * 1024;
const PUBLIC_UPLOAD_CONCURRENCY_DESKTOP = 2;
const PUBLIC_UPLOAD_CONCURRENCY_MOBILE = 2;
const FOLDER_CACHE_MAX = 10;
const FOLDER_CACHE_TTL_MS = 5 * 60 * 1000;
const FOLDER_LIST_CACHE_TTL_MS = 5 * 60 * 1000;
const LAN_AUTO_SWITCH_TIMEOUT_MS = 1200;
const LAN_AUTO_SWITCH_KEY = "pcd.lanAutoSwitchAt";
const ACCESS_INFO_REFRESH_MS = 6000;
const ACCESS_INFO_QUICK_REFRESH_GAP_MS = 400;
const ACCESS_INFO_TIMEOUT_MS = 4500;
const STORAGE_USAGE_REFRESH_MS = 60000;
const STORAGE_USAGE_FORCE_MIN_GAP_MS = 1200;
const STORAGE_USAGE_SOFT_MIN_GAP_MS = 12000;
const HEALTH_REFRESH_MS = 60000;

function setStatus(message) {
  statusLine.textContent = message;
  statusLine.title = message || "";
}

function syncAiGlobalBtnUi() {
  if (!aiGlobalSearchBtn) return;
  const isFolder = Boolean(state.path) && !state.trashMode;
  const textSpan = aiGlobalSearchBtn.querySelector("span");
  if (isFolder) {
    const folderName = displayFolder(state.path || "") || "当前文件夹";
    if (textSpan) textSpan.textContent = "文件夹对话";
    aiGlobalSearchBtn.classList.add("is-folder");
    aiGlobalSearchBtn.title = `使用满血 AI 旗舰大模型（deepseek-v4-pro）围绕当前文件夹（${folderName}）进行对话与梳理`;
  } else {
    if (textSpan) textSpan.textContent = "全库问答";
    aiGlobalSearchBtn.classList.remove("is-folder");
    aiGlobalSearchBtn.title = "使用满血 AI 旗舰大模型（deepseek-v4-pro）进行全库问答与检索";
  }
}

function syncAiModeUi(options = {}) {
  if (!aiModeToggleBtn) return;
  aiModeToggleBtn.classList.toggle("active", state.aiModeEnabled);
  aiModeToggleBtn.setAttribute("aria-pressed", state.aiModeEnabled ? "true" : "false");
  aiModeToggleBtn.textContent = state.aiModeEnabled ? "AI模式 开" : "AI模式";
  aiModeToggleBtn.title = state.aiModeEnabled ? "关闭后隐藏每行的 AI 对话入口" : "开启后每个文件和文件夹都会显示 AI 对话入口";
  aiGlobalSearchBtn?.classList.toggle("hidden", !state.aiModeEnabled);
  syncAiGlobalBtnUi();
  if (state.aiModeEnabled && aiGlobalSearchBtn && options.animate) {
    aiGlobalSearchBtn.classList.remove("ai-animate-in");
    void aiGlobalSearchBtn.offsetWidth;
    aiGlobalSearchBtn.classList.add("ai-animate-in");
    aiGlobalSearchBtn.addEventListener("animationend", () => {
      aiGlobalSearchBtn.classList.remove("ai-animate-in");
    }, { once: true });
  }
}

function setAiModeEnabled(enabled, { render = true } = {}) {
  state.aiModeEnabled = Boolean(enabled);
  if (!state.aiModeEnabled) {
    closeAiDrawer();
  }
  syncAiModeUi({ animate: state.aiModeEnabled });
  setStatus(state.aiModeEnabled ? "AI 模式已开启：每个项目都可以显示 AI 对话入口" : "AI 模式已关闭");
  if (render) {
    cancelAnimationFrame(aiModeRenderFrame);
    aiModeRenderFrame = requestAnimationFrame(() => {
      renderRows({ noAnimation: false, animateAi: state.aiModeEnabled });
    });
  }
}

function syncAiWebSearchUi() {
  if (!aiWebSearchToggleBtn) return;
  aiWebSearchToggleBtn.classList.toggle("active", state.aiWebSearchEnabled);
  aiWebSearchToggleBtn.setAttribute("aria-pressed", state.aiWebSearchEnabled ? "true" : "false");
  const webLabel = state.aiWebSearchEnabled ? "联网开启" : "联网关闭";
  const labelEl = aiWebSearchToggleBtn.querySelector(".pill-label");
  if (labelEl) {
    labelEl.textContent = webLabel;
  } else {
    aiWebSearchToggleBtn.textContent = webLabel;
  }
  aiWebSearchToggleBtn.title = state.aiWebSearchEnabled
    ? "已开启 DeepSeek 官方联网搜索；本次是否检索由 AI 根据问题自动判断"
    : "默认不联网；开启后可使用 DeepSeek 官方联网搜索";
}

function setAiWebSearchEnabled(enabled) {
  state.aiWebSearchEnabled = Boolean(enabled);
  syncAiWebSearchUi();
  setStatus(state.aiWebSearchEnabled ? "联网搜索开关已开启" : "联网搜索开关已关闭");
}

function openAiChatPlaceholder(item) {
  openAiDrawer("item", item);
}

function openAiGlobalSearchPlaceholder() {
  const query = searchInput?.value.trim() || "";
  if (state.aiDrawer) state.aiDrawer.forceGlobal = false;
  openAiDrawer("global");
  if (query) {
    if (aiPromptInput) aiPromptInput.value = `帮我搜索网盘中与“${query}”相关的文件，并分析其内容与用途`;
    syncAiPromptSendState();
    pulseAiSendButton();
    submitAiPrompt();
  }
}

function aiInitialMessages(mode, item = null) {
  const currentScope = getCurrentAiScope();
  let targetLabel = "全部文件";
  if (currentScope.type === "item") {
    targetLabel = `当前文件“${currentScope.label}”`;
  } else if (currentScope.type === "folder") {
    targetLabel = `当前文件夹“${currentScope.label}”`;
  }
  return [{
    role: "assistant",
    isInitial: true,
    text: `我会围绕${targetLabel}回答。`,
  }];
}

function aiConversationKey(mode = state.aiDrawer.mode, item = state.aiDrawer.item, scopePath = state.path) {
  const targetPath = mode === "item" ? item?.path || "" : (state.aiDrawer?.forceGlobal ? "" : scopePath || "");
  return `${mode}:${targetPath}`;
}

function cloneAiMessages(messages = []) {
  return messages
    .filter((message) => !message.pending)
    .map((message) => ({
      role: message.role,
      isInitial: Boolean(message.isInitial),
      text: message.text,
      reasoning: message.reasoning || "",
      results: Array.isArray(message.results) ? message.results.map((item) => ({ ...item })) : [],
      model: message.model,
      thinking: message.thinking,
      webSearch: message.webSearch
        ? {
            ...message.webSearch,
            sources: Array.isArray(message.webSearch.sources) ? message.webSearch.sources.map((item) => ({ ...item })) : [],
          }
        : null,
    }));
}

function saveAiConversation() {
  if (!state.aiDrawer.key || !state.aiDrawer.messages.length) return;
  state.aiConversations.set(state.aiDrawer.key, cloneAiMessages(state.aiDrawer.messages));
}

function loadAiConversation(mode, item, key) {
  const saved = state.aiConversations.get(key);
  return saved?.length ? cloneAiMessages(saved) : aiInitialMessages(mode, item);
}

function setAiModel(model) {
  state.aiDrawer.model = "reasoner";
  aiModelReasonerBtn?.classList.add("active");
  setStatus("已启用深度思考模式 (DeepSeek Reasoner)");
}

function aiModelDisplayName() {
  return "deepseek-v4-pro";
}

function aiModelModeLabel() {
  return "满血版";
}

function aiPendingText(prompt, mode, webSearchEnabled = false) {
  const text = String(prompt || "");
  if (mode === "item") {
    if (/总结|摘要|概括|重点|提纲/.test(text)) return "正在读取文件并提炼重点，请稍等...";
    if (/分析|原因|对比|建议|评价/.test(text)) return "正在结合文件内容分析，请稍等...";
    if (/公式|计算|证明|推导/.test(text)) return "正在检查文件里的公式和逻辑，请稍等...";
    return "正在读取当前文件，请稍等...";
  }
  if (/你好|您好|哈喽|hello|hi|在吗|你是谁|你能做什么|帮助|怎么用/.test(text)) return "正在组织回复，请稍等...";
  if (webSearchEnabled) {
    if (/找|查|搜索|在哪|资料|文件|最新|当前|目前|最近/.test(text)) return "正在整理当前范围，并准备联网检索，请稍等...";
    return "正在整理上下文，并准备按需联网检索，请稍等...";
  }
  if (/找|查|搜索|在哪|资料|文件/.test(text)) return "正在检索文件名、路径和轻量内容...";
  if (/总结|整理|分类|用途|结构|清单/.test(text)) return "正在按文件夹、路径和文件信息整理资料...";
  if (/最近|最新|时间|修改/.test(text)) return "正在按修改时间和文件信息筛选...";
  return "正在整理当前范围，请稍等...";
}

function updateAiPendingMessage(pendingMessage, text) {
  if (!pendingMessage || !pendingMessage.pending) return;
  if (!state.aiDrawer.messages.includes(pendingMessage)) return;
  pendingMessage.text = text;
  const pendingEl = aiMessages?.querySelector(".ai-message.pending");
  if (pendingEl) {
    const p = pendingEl.querySelector(".ai-markdown p") || pendingEl.querySelector("p");
    if (p) {
      p.textContent = text;
      return;
    }
    const textEl = pendingEl.querySelector(".ai-markdown") || pendingEl;
    textEl.replaceChildren(renderAiMarkdown(text, pendingMessage.reasoning));
  }
}

function clearAiPendingTimers(pendingMessage) {
  if (!pendingMessage) return;
  if (pendingMessage.pendingStageTimers) {
    for (const timer of pendingMessage.pendingStageTimers) {
      clearTimeout(timer);
    }
  }
  pendingMessage.pendingStageTimers = [];
}

function scheduleAiPendingStages(pendingMessage, prompt, mode, webSearchEnabled) {
  clearAiPendingTimers(pendingMessage);
  const timers = [];
  const nextStageText = mode === "item"
    ? (webSearchEnabled ? "上下文已整理，正在结合文件内容并准备联网检索，请稍等..." : "上下文已整理，正在读取文件内容，请稍等...")
    : (webSearchEnabled ? "上下文已整理，正在准备联网检索，请稍等..." : "上下文已整理，正在请求 AI 处理，请稍等...");
  timers.push(window.setTimeout(() => {
    updateAiPendingMessage(pendingMessage, nextStageText);
  }, AI_PENDING_CONTEXT_DELAY_MS));
  timers.push(window.setTimeout(() => {
    if (!state.aiDrawer.messages.includes(pendingMessage) || !pendingMessage.pending) return;
    const slowText = mode === "item"
      ? "AI 仍在处理当前文件，可能是内容较多，请稍等..."
      : "AI 仍在整理当前范围，可能是资料较多，请稍等...";
    updateAiPendingMessage(pendingMessage, slowText);
  }, AI_PENDING_LONG_DELAY_MS));
  pendingMessage.pendingStageTimers = timers;
}

function aiDrawerSnapshot() {
  return {
    mode: state.aiDrawer.mode,
    item: state.aiDrawer.item,
    key: state.aiDrawer.key,
  };
}

let aiChatAbortController = null;
let isAiGenerating = false;

function autoResizeAiPromptInput() {
  if (!aiPromptInput) return;
  aiPromptInput.style.height = "auto";
  const scrollH = aiPromptInput.scrollHeight;
  const targetH = Math.min(Math.max(scrollH, 24), 140);
  aiPromptInput.style.height = `${targetH}px`;
  aiPromptInput.style.overflowY = scrollH > 140 ? "auto" : "hidden";
}

function getAiSessionsStorageKey() {
  const username = state.currentUser?.username || "admin";
  return `pcd.aiSessions.${username}`;
}

function loadStoredAiSessions() {
  try {
    const raw = localStorage.getItem(getAiSessionsStorageKey());
    if (!raw) return [];
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch (err) {
    console.warn("Failed to load AI sessions from localStorage:", err);
    return [];
  }
}

function saveStoredAiSessions(sessions) {
  try {
    const trimmed = Array.isArray(sessions) ? sessions.slice(0, 50) : [];
    localStorage.setItem(getAiSessionsStorageKey(), JSON.stringify(trimmed));
  } catch (err) {
    console.warn("Failed to save AI sessions to localStorage:", err);
  }
}

function formatAiSessionTime(ts) {
  if (!ts) return "";
  const now = Date.now();
  const diffSec = Math.floor((now - ts) / 1000);
  if (diffSec < 60) return "刚刚";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} 分钟前`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} 小时前`;
  const d = new Date(ts);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${m}-${day} ${h}:${min}`;
}

function getSessionScopeKey(session) {
  if (!session) return "global";
  if (session.scopeKey) return session.scopeKey;
  if (session.mode === "item") return `item:${session.itemPath || session.targetLabel}`;
  if (session.mode === "folder") return `folder:${session.itemPath || session.targetLabel}`;
  return "global";
}

function getCurrentAiScope() {
  const isItem = state.aiDrawer.mode === "item" && Boolean(state.aiDrawer.item);
  if (isItem) {
    const item = state.aiDrawer.item;
    const isFolder = item.type === "folder";
    return {
      type: isFolder ? "folder" : "item",
      key: `item:${item.path}`,
      label: item.name || (isFolder ? "文件夹" : "单个文件"),
      itemPath: item.path,
    };
  }

  // mode === "global": differentiate folder-level vs root global scope
  if (state.aiDrawer?.forceGlobal) {
    return {
      type: "global",
      key: "global",
      label: "全局资料库",
      itemPath: "",
    };
  }

  const currentPath = (state.path || "").trim();
  if (currentPath) {
    const folderName = currentPath.split("/").filter(Boolean).pop() || displayFolder(currentPath) || "当前文件夹";
    return {
      type: "folder",
      key: `folder:${currentPath}`,
      label: folderName,
      itemPath: currentPath,
    };
  }

  return {
    type: "global",
    key: "global",
    label: "全局资料库",
    itemPath: "",
  };
}

function syncCurrentAiSessionScope() {
  const currentScope = getCurrentAiScope();
  const sessions = loadStoredAiSessions();
  const activeSess = sessions.find((s) => s.id === state.currentAiSessionId);
  const activeScopeKey = activeSess ? getSessionScopeKey(activeSess) : null;
  if (activeScopeKey !== currentScope.key) {
    const latestForScope = sessions.find((s) => getSessionScopeKey(s) === currentScope.key);
    state.currentAiSessionId = latestForScope ? latestForScope.id : null;
  }
}

function archiveCurrentAiSession() {
  const messages = state.aiDrawer.messages || [];
  const userMessages = messages.filter((m) => m.role === "user" && m.text && !m.pending);
  if (!userMessages.length) return;

  const firstUserText = userMessages[0].text.trim();
  const sessionTitle = firstUserText.length > 28 ? firstUserText.slice(0, 26) + "..." : firstUserText;
  const scope = getCurrentAiScope();

  const sessions = loadStoredAiSessions();
  const now = Date.now();

  let existingIdx = state.currentAiSessionId
    ? sessions.findIndex((s) => s.id === state.currentAiSessionId)
    : -1;

  // STRICT ISOLATION: If the existing session belongs to another scope, disconnect so we never overwrite across scopes!
  if (existingIdx >= 0) {
    const existingScopeKey = getSessionScopeKey(sessions[existingIdx]);
    if (existingScopeKey !== scope.key) {
      existingIdx = -1;
      state.currentAiSessionId = null;
    }
  }

  const validMessages = cloneAiMessages(messages.filter((m) => !m.pending));

  if (existingIdx >= 0) {
    sessions[existingIdx].messages = validMessages;
    sessions[existingIdx].updatedAt = now;
    sessions[existingIdx].scopeKey = scope.key;
    sessions[existingIdx].scopeType = scope.type;
    sessions[existingIdx].targetLabel = scope.label;
    sessions[existingIdx].itemPath = scope.itemPath;
    if (!sessions[existingIdx].customTitle && (!sessions[existingIdx].title || sessions[existingIdx].title === "新对话")) {
      sessions[existingIdx].title = sessionTitle;
    }
  } else {
    const newSessionId = state.currentAiSessionId || ("ai_sess_" + now + "_" + Math.random().toString(36).slice(2, 7));
    state.currentAiSessionId = newSessionId;
    sessions.unshift({
      id: newSessionId,
      title: sessionTitle || "新对话",
      createdAt: now,
      updatedAt: now,
      mode: scope.type,
      scopeType: scope.type,
      scopeKey: scope.key,
      targetLabel: scope.label,
      itemPath: scope.itemPath,
      messages: validMessages,
    });
  }

  sessions.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  saveStoredAiSessions(sessions);
}

function renameAiSession(sessionId, newTitle) {
  const trimmed = (newTitle || "").trim();
  if (!trimmed) return;
  const sessions = loadStoredAiSessions();
  const target = sessions.find((s) => s.id === sessionId);
  if (!target) return;
  target.title = trimmed.length > 50 ? trimmed.slice(0, 48) + "..." : trimmed;
  target.updatedAt = Date.now();
  target.customTitle = true;
  saveStoredAiSessions(sessions);
  renderAiHistoryPanel();
  setStatus(`会话已重命名为：“${target.title}”`);
}

function toggleAiHistoryPanel() {
  if (!aiHistoryPanel) return;
  if (aiHistoryPanel.classList.contains("hidden")) {
    archiveCurrentAiSession();
    openAiHistoryPanel();
  } else {
    closeAiHistoryPanel();
  }
}

function openAiHistoryPanel() {
  if (!aiHistoryPanel) return;
  aiHistoryPanel.classList.remove("hidden");
  aiHistoryPanel.setAttribute("aria-hidden", "false");
  aiHistoryBtn?.classList.add("active");
  renderAiHistoryPanel();
}

function closeAiHistoryPanel() {
  if (!aiHistoryPanel) return;
  aiHistoryPanel.classList.add("hidden");
  aiHistoryPanel.setAttribute("aria-hidden", "true");
  aiHistoryBtn?.classList.remove("active");
}

function renderAiHistoryPanel() {
  if (!aiHistoryList) return;
  const currentScope = getCurrentAiScope();
  const allSessions = loadStoredAiSessions();

  // STRICT ISOLATION: Only show sessions belonging to the CURRENT scope!
  const sessions = allSessions.filter((s) => getSessionScopeKey(s) === currentScope.key);

  if (aiHistoryTitleText) {
    if (currentScope.type === "item") {
      aiHistoryTitleText.textContent = `文件历史 (${currentScope.label})`;
    } else if (currentScope.type === "folder") {
      aiHistoryTitleText.textContent = `文件夹历史 (${currentScope.label})`;
    } else {
      aiHistoryTitleText.textContent = "全库问答历史";
    }
    aiHistoryTitleText.title = currentScope.label;
  }

  if (aiClearAllHistoryBtn) {
    if (currentScope.type === "item") {
      aiClearAllHistoryBtn.textContent = "清空本文件记录";
    } else if (currentScope.type === "folder") {
      aiClearAllHistoryBtn.textContent = "清空本文件夹记录";
    } else {
      aiClearAllHistoryBtn.textContent = "清空全库记录";
    }
  }

  if (aiHistoryCount) {
    aiHistoryCount.textContent = `${sessions.length} 条`;
  }

  if (!sessions.length) {
    const typeLabel = currentScope.type === "item" ? "文件" : (currentScope.type === "folder" ? "文件夹" : "全库问答");
    aiHistoryList.innerHTML = `
      <div class="ai-history-empty">
        <div class="ai-history-empty-icon">💬</div>
        <div class="ai-history-empty-text">当前${typeLabel}暂无历史记录</div>
        <p class="ai-history-empty-hint">发送提问或开启新对话时将自动归档在此</p>
      </div>
    `;
    return;
  }

  aiHistoryList.innerHTML = "";
  sessions.forEach((session) => {
    const isCurrent = session.id === state.currentAiSessionId;
    const timeStr = formatAiSessionTime(session.updatedAt);
    const turnCount = (session.messages || []).filter((m) => m.role === "user").length;
    const scopeBadgeLabel = session.targetLabel || (currentScope.type === "item" ? currentScope.label : (currentScope.type === "folder" ? `文件夹: ${currentScope.label}` : "全局资料库"));

    const card = document.createElement("div");
    card.className = `ai-history-card${isCurrent ? " active" : ""}`;
    card.dataset.id = session.id;

    card.innerHTML = `
      <div class="ai-history-card-header">
        <div class="ai-history-card-title-row">
          <strong class="ai-history-card-title" title="${escapeHtml(session.title)} (双击或点击铅笔可修改名称)">${escapeHtml(session.title)}</strong>
          ${isCurrent ? '<span class="ai-history-card-badge current">当前</span>' : ""}
        </div>
        <div class="ai-history-card-actions">
          <button class="ai-history-card-edit-btn" type="button" title="修改会话名称" aria-label="修改会话名称" data-edit-id="${session.id}">
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8">
              <path d="M12.5 3.5l4 4L6 18H2v-4L12.5 3.5z" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          <button class="ai-history-card-del-btn" type="button" title="删除此条记录" aria-label="删除此条记录" data-del-id="${session.id}">
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8">
              <path d="M4 6h12M7 6V4a1 1 0 011-1h4a1 1 0 011 1v2m2 0v10a2 2 0 01-2 2H7a2 2 0 01-2-2V6h10z" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
      <div class="ai-history-card-meta">
        <span class="ai-history-card-time">${timeStr}</span>
        <span class="ai-history-card-scope">${escapeHtml(scopeBadgeLabel)}</span>
        <span class="ai-history-card-turns">${turnCount} 轮问答</span>
      </div>
    `;

    const startEditing = () => {
      const titleRow = card.querySelector(".ai-history-card-title-row");
      const titleEl = card.querySelector(".ai-history-card-title");
      if (!titleRow || !titleEl || titleRow.querySelector(".ai-history-title-input")) return;

      const input = document.createElement("input");
      input.type = "text";
      input.className = "ai-history-title-input";
      input.value = session.title;
      input.maxLength = 50;
      input.placeholder = "输入会话标题...";

      let finished = false;
      const finishEdit = (save) => {
        if (finished) return;
        finished = true;
        const newTitle = input.value.trim();
        if (save && newTitle && newTitle !== session.title) {
          renameAiSession(session.id, newTitle);
        } else {
          renderAiHistoryPanel();
        }
      };

      input.addEventListener("click", (e) => e.stopPropagation());
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          finishEdit(true);
        } else if (e.key === "Escape") {
          e.preventDefault();
          finishEdit(false);
        }
      });
      input.addEventListener("blur", () => finishEdit(true));

      titleEl.style.display = "none";
      titleRow.insertBefore(input, titleEl);
      input.focus();
      input.select();
    };

    const editBtn = card.querySelector(".ai-history-card-edit-btn");
    editBtn?.addEventListener("click", (e) => {
      e.stopPropagation();
      startEditing();
    });

    const titleEl = card.querySelector(".ai-history-card-title");
    titleEl?.addEventListener("dblclick", (e) => {
      e.stopPropagation();
      startEditing();
    });

    card.addEventListener("click", (e) => {
      if (e.target.closest(".ai-history-card-actions") || e.target.closest(".ai-history-title-input")) return;
      switchAiSession(session.id);
    });

    const delBtn = card.querySelector(".ai-history-card-del-btn");
    delBtn?.addEventListener("click", async (e) => {
      e.stopPropagation();
      await deleteAiSession(session.id);
    });

    aiHistoryList.appendChild(card);
  });
}

function switchAiSession(sessionId) {
  archiveCurrentAiSession();
  const sessions = loadStoredAiSessions();
  const target = sessions.find((s) => s.id === sessionId);
  if (!target) return;

  state.currentAiSessionId = target.id;
  state.aiDrawer.messages = cloneAiMessages(target.messages || []);
  saveAiConversation();
  renderAiDrawer();
  closeAiHistoryPanel();
  setStatus(`已载入历史对话: ${target.title}`);
}

async function deleteAiSession(sessionId) {
  let sessions = loadStoredAiSessions();
  const target = sessions.find((s) => s.id === sessionId);
  if (!target) return;

  const confirmed = await openDialog({
    eyebrow: "会话管理",
    title: "删除历史会话",
    description: `确定要删除“${target.title}”这条历史会话记录吗？`,
    confirmText: "删除",
    danger: true,
  });
  if (!confirmed) return;

  sessions = sessions.filter((s) => s.id !== sessionId);
  saveStoredAiSessions(sessions);

  if (state.currentAiSessionId === sessionId) {
    state.currentAiSessionId = null;
    state.aiDrawer.messages = aiInitialMessages(state.aiDrawer.mode, state.aiDrawer.item);
    renderAiDrawer();
  }

  renderAiHistoryPanel();
  setStatus("已删除该条历史会话");
}

async function clearAllAiSessions() {
  const currentScope = getCurrentAiScope();
  let allSessions = loadStoredAiSessions();
  const targetSessions = allSessions.filter((s) => getSessionScopeKey(s) === currentScope.key);

  if (!targetSessions.length) {
    setStatus("当前范围暂无历史记录可清空");
    return;
  }

  const isItem = currentScope.type === "item";
  const isFolder = currentScope.type === "folder";
  const title = isItem ? "清空本文件历史记录" : (isFolder ? "清空本文件夹历史记录" : "清空全库历史会话");
  const description = isItem
    ? `确定要清空关于“${currentScope.label}”的 ${targetSessions.length} 条历史会话吗？（其他文件、文件夹与全库历史不受影响）`
    : (isFolder
      ? `确定要清空关于“${currentScope.label}”文件夹的 ${targetSessions.length} 条历史会话吗？（其他文件夹、文件与全库历史不受影响）`
      : `确定要清空全库问答的 ${targetSessions.length} 条历史会话吗？（各文件与各文件夹的历史会话不受影响）`);

  const confirmed = await openDialog({
    eyebrow: "会话管理",
    title,
    description,
    confirmText: "确认清空",
    danger: true,
  });
  if (!confirmed) return;

  // STRICT ISOLATION: Only delete sessions matching current scope! Keep all others untouched!
  allSessions = allSessions.filter((s) => getSessionScopeKey(s) !== currentScope.key);

  saveStoredAiSessions(allSessions);
  state.currentAiSessionId = null;
  state.aiDrawer.messages = aiInitialMessages(state.aiDrawer.mode, state.aiDrawer.item);
  renderAiDrawer();
  renderAiHistoryPanel();
  const statusMsg = isItem
    ? "已清空本文件的历史会话记录"
    : (isFolder ? "已清空本文件夹的历史会话记录" : "已清空全库问答历史记录");
  setStatus(statusMsg);
}

function startNewAiChat() {
  if (isAiGenerating && aiChatAbortController) {
    aiChatAbortController.abort();
  }
  archiveCurrentAiSession();
  state.currentAiSessionId = null;
  state.aiDrawer.messages = aiInitialMessages(state.aiDrawer.mode, state.aiDrawer.item);
  saveAiConversation();
  renderAiDrawer();
  closeAiHistoryPanel();
  if (aiPromptInput) {
    aiPromptInput.value = "";
    autoResizeAiPromptInput();
    aiPromptInput.focus();
  }
  syncAiPromptSendState();
  setStatus("已开启新对话，上下文已重置");
}

function syncAiPromptSendState() {
  if (isAiGenerating) {
    aiPromptForm?.classList.add("has-text");
    aiPromptSendBtn?.setAttribute("aria-disabled", "false");
    aiPromptSendBtn?.removeAttribute("disabled");
    return;
  }
  const hasText = Boolean(aiPromptInput?.value.trim());
  aiPromptForm?.classList.toggle("has-text", hasText);
  aiPromptSendBtn?.setAttribute("aria-disabled", hasText ? "false" : "true");
}

function pulseAiSendButton() {
  if (!aiPromptSendBtn || (!isAiGenerating && !aiPromptInput?.value.trim())) return;
  window.clearTimeout(aiPromptPressTimer);
  aiPromptSendBtn.classList.remove("is-pressing");
  void aiPromptSendBtn.offsetWidth;
  aiPromptSendBtn.classList.add("is-pressing");
  aiPromptPressTimer = window.setTimeout(() => {
    aiPromptSendBtn.classList.remove("is-pressing");
  }, 170);
}

function openAiDrawer(mode = "global", item = null, options = {}) {
  window.clearTimeout(aiDrawerCloseTimer);
  closeAiHistoryPanel();
  closeRowActionMenus();
  const previous = options.returnToCurrent ? aiDrawerSnapshot() : null;
  state.aiDrawer.mode = mode === "item" ? "item" : "global";
  state.aiDrawer.item = state.aiDrawer.mode === "item" ? item : null;
  if (!options.preserveForceGlobal) {
    state.aiDrawer.forceGlobal = false;
  }
  state.aiDrawer.key = aiConversationKey(state.aiDrawer.mode, state.aiDrawer.item, state.path);

  // Synchronize state.currentAiSessionId to match the new scope
  syncCurrentAiSessionScope();

  state.aiDrawer.messages = loadAiConversation(state.aiDrawer.mode, state.aiDrawer.item, state.aiDrawer.key);
  state.aiDrawer.returnTo = previous?.mode === "global" ? previous : null;
  renderAiDrawer();
  aiDrawer?.classList.remove("closing");
  aiDrawer?.classList.remove("hidden");
  aiDrawer?.setAttribute("aria-hidden", "false");
  syncAiPromptSendState();

  // Decouple full-page grid docked reflow and trigger slide-in on pristine compositor frame
  requestAnimationFrame(() => {
    driveView?.classList.add("ai-drawer-docked");
    document.body.classList.add("ai-drawer-open");
  });

  // Schedule auto-resize and focus AFTER the 380ms GPU animation completes smoothly!
  window.setTimeout(() => {
    autoResizeAiPromptInput();
    aiPromptInput?.focus({ preventScroll: true });
  }, 380);

  const currentScope = getCurrentAiScope();
  setStatus(state.aiDrawer.mode === "item" && item
    ? `已打开“${itemName(item)}”的 AI 对话`
    : (currentScope.type === "folder" ? `已打开“${currentScope.label}”的 AI 文件夹对话` : "已打开 AI 全库问答"));

  // Defer session storage persistence until animation completes smoothly
  window.setTimeout(() => {
    archiveCurrentAiSession();
    saveAiConversation();
  }, 400);
}

function returnToAiGlobalDrawer() {
  const target = state.aiDrawer.returnTo;
  if (!target) return;
  closeAiHistoryPanel();
  state.aiDrawer.mode = "global";
  state.aiDrawer.item = null;
  state.aiDrawer.forceGlobal = false;
  state.aiDrawer.key = target.key || aiConversationKey("global", null, state.path);

  // Synchronize state.currentAiSessionId to match global/folder scope
  syncCurrentAiSessionScope();

  state.aiDrawer.messages = loadAiConversation("global", null, state.aiDrawer.key);
  state.aiDrawer.returnTo = null;
  renderAiDrawer();
  syncAiPromptSendState();
  window.setTimeout(() => {
    autoResizeAiPromptInput();
    aiPromptInput?.focus({ preventScroll: true });
  }, 100);
  const currentScope = getCurrentAiScope();
  setStatus(currentScope.type === "folder" ? `已返回“${currentScope.label}”的 AI 文件夹对话` : "已返回 AI 全库问答");
  window.setTimeout(() => {
    archiveCurrentAiSession();
    saveAiConversation();
  }, 400);
}

function handleAiDrawerBackOrSwitch() {
  if (state.aiDrawer.mode === "item" && state.aiDrawer.returnTo) {
    returnToAiGlobalDrawer();
    return;
  }
  if (state.aiDrawer.mode === "global" && state.path) {
    closeAiHistoryPanel();
    archiveCurrentAiSession();
    saveAiConversation();
    state.aiDrawer.forceGlobal = !state.aiDrawer.forceGlobal;
    state.aiDrawer.key = aiConversationKey("global", null, state.path);
    syncCurrentAiSessionScope();
    state.aiDrawer.messages = loadAiConversation("global", null, state.aiDrawer.key);
    renderAiDrawer();
    syncAiPromptSendState();
    const currentScope = getCurrentAiScope();
    if (state.aiDrawer.forceGlobal) {
      setStatus("已切换为 AI 全库问答，可跨目录提问与检索整个网盘");
    } else {
      setStatus(`已切回“${currentScope.label}”文件夹对话`);
    }
    window.setTimeout(() => {
      autoResizeAiPromptInput();
      aiPromptInput?.focus({ preventScroll: true });
    }, 100);
    return;
  }
  if (state.aiDrawer.returnTo) {
    returnToAiGlobalDrawer();
  }
}

function closeAiDrawer() {
  closeAiHistoryPanel();
  closeRowActionMenus();
  if (!aiDrawer || aiDrawer.classList.contains("hidden")) return;
  aiPromptInput?.blur();
  driveView?.classList.remove("ai-drawer-docked");
  document.body.classList.remove("ai-drawer-open");
  window.clearTimeout(aiDrawerCloseTimer);
  aiDrawer.classList.add("closing");
  aiDrawer?.setAttribute("aria-hidden", "true");
  aiDrawerCloseTimer = window.setTimeout(() => {
    aiDrawer.classList.add("hidden");
    aiDrawer.classList.remove("closing");
  }, 380);
  setStatus(state.items?.length ? `已加载 ${state.items.length} 个项目，上传将保存到当前目录。` : "准备就绪");
  window.setTimeout(() => {
    archiveCurrentAiSession();
    saveAiConversation();
  }, 400);
}

function aiSuggestionButton(label, prompt) {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = label;
  button.addEventListener("click", () => {
    if (aiPromptInput) {
      aiPromptInput.value = prompt || label;
      autoResizeAiPromptInput();
    }
    syncAiPromptSendState();
    pulseAiSendButton();
    submitAiPrompt();
  });
  return button;
}

function aiActionLink(label, handler, className = "") {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = label;
  button.className = className;
  button.addEventListener("click", handler);
  return button;
}

function lockedFolderForAiItem(item) {
  syncAiResultItemLockState(item);
  const itemPath = item?.path || "";
  if (!itemPath) return "";
  if (item?.requiresUnlock) {
    const lockedPath = item.lockedFolderPath || (item.type === "folder" ? item.path : parentPath(item.path));
    return isFolderUnlocked(lockedPath) ? "" : lockedPath;
  }
  if (item?.type === "folder" && item.locked && !(item.unlocked || isFolderUnlocked(item.path))) return item.path;
  const locked = state.items.find((candidate) => (
    candidate.type === "folder" &&
    candidate.locked &&
    !isFolderUnlocked(candidate.path) &&
    (itemPath === candidate.path || itemPath.startsWith(`${candidate.path}/`))
  ));
  return locked?.path || "";
}

function itemPathIsInsideFolder(itemPath, folderPath) {
  return Boolean(folderPath && itemPath && (itemPath === folderPath || itemPath.startsWith(`${folderPath}/`)));
}

function syncAiResultItemLockState(item) {
  if (!item?.path) return item;
  const itemPath = item.path;
  const liveFolder = state.items.find((candidate) => candidate.type === "folder" && candidate.path === itemPath);
  if (item.type === "folder" && liveFolder) {
    item.locked = Boolean(liveFolder.locked);
    item.unlocked = Boolean(liveFolder.unlocked || isFolderUnlocked(liveFolder.path));
    if (!item.locked || item.unlocked) {
      item.requiresUnlock = false;
      item.lockedFolderPath = "";
    } else {
      item.requiresUnlock = true;
      item.lockedFolderPath = item.path;
    }
    return item;
  }

  const currentLockedFolder = state.items.find((candidate) => (
    candidate.type === "folder" &&
    candidate.locked &&
    !isFolderUnlocked(candidate.path) &&
    itemPathIsInsideFolder(itemPath, candidate.path)
  ));
  const knownLockedPath = item.lockedFolderPath || (item.requiresUnlock ? parentPath(itemPath) : "");
  if (currentLockedFolder) {
    item.requiresUnlock = true;
    item.lockedFolderPath = currentLockedFolder.path;
  } else if (knownLockedPath && isFolderUnlocked(knownLockedPath)) {
    item.requiresUnlock = false;
    item.lockedFolderPath = "";
    if (item.type === "folder" && item.locked) item.unlocked = true;
  }
  return item;
}

function syncAiResultCardsWithFolderState() {
  for (const message of state.aiDrawer.messages) {
    if (!Array.isArray(message.results)) continue;
    for (const item of message.results) syncAiResultItemLockState(item);
  }
}

function markFolderUnlockedEverywhere(folderPath) {
  if (!folderPath) return;
  state.unlockedFolders.add(folderPath);
  for (const item of state.items) {
    if (item.type === "folder" && item.path === folderPath && item.locked) item.unlocked = true;
  }
  for (const message of state.aiDrawer.messages) {
    if (!Array.isArray(message.results)) continue;
    for (const item of message.results) {
      const itemPath = item?.path || "";
      const lockedPath = item.lockedFolderPath || (item.type === "folder" ? itemPath : parentPath(itemPath));
      if (lockedPath !== folderPath && itemPath !== folderPath && !itemPath.startsWith(`${folderPath}/`)) continue;
      item.requiresUnlock = false;
      item.lockedFolderPath = "";
      if (item.type === "folder" && item.locked) item.unlocked = true;
    }
  }
  syncAiResultCardsWithFolderState();
}

function markFolderLockChangedEverywhere(folderPath, locked) {
  if (!folderPath) return;
  if (locked) state.unlockedFolders.add(folderPath);
  else state.unlockedFolders.delete(folderPath);
  for (const item of state.items) {
    if (item.type !== "folder" || item.path !== folderPath) continue;
    item.locked = Boolean(locked);
    item.unlocked = Boolean(locked);
  }
  for (const message of state.aiDrawer.messages) {
    if (!Array.isArray(message.results)) continue;
    for (const item of message.results) {
      if (!itemPathIsInsideFolder(item?.path || "", folderPath)) continue;
      item.requiresUnlock = false;
      item.lockedFolderPath = "";
      if (item.type === "folder" && item.path === folderPath) {
        item.locked = Boolean(locked);
        item.unlocked = Boolean(locked);
      }
    }
  }
  syncAiResultCardsWithFolderState();
}

function openItemFromAi(item) {
  if (!item) return;
  const lockedFolderPath = lockedFolderForAiItem(item);
  if (lockedFolderPath) {
    const folderPath = lockedFolderPath;
    unlockFolder(folderPath, displayFolder(folderPath) || itemName(item)).then((ok) => {
      if (!ok) return;
      item.requiresUnlock = false;
      item.lockedFolderPath = "";
      item.unlocked = true;
      markFolderUnlockedEverywhere(folderPath);
      renderAiMessages();
    });
    return;
  }
  if (item.type === "folder") {
    ensureFolderReady(item.path, itemName(item)).then((ok) => {
      if (ok) {
        closeAiDrawer();
        loadFolder(item.path);
      }
    });
    return;
  }
  void openPreview(item);
}

function renderAiContextCard() {
  if (!aiContextCard) return;
  aiContextCard.replaceChildren();
  if (state.aiDrawer.mode === "global") {
    const isFolder = Boolean(state.path) && !state.aiDrawer?.forceGlobal;
    const title = document.createElement("strong");
    title.textContent = isFolder ? "AI文件夹对话" : "AI全库问答";
    const desc = document.createElement("span");
    const scopePath = isFolder ? `全部文件 / ${state.path}` : "全部文件";
    desc.textContent = isFolder
      ? `范围：${scopePath}；围绕当前文件夹内容进行问答与梳理。`
      : `范围：${scopePath}；可结合文件名、路径和全库结构。`;
    aiContextCard.append(title, desc);
    return;
  }

  const item = state.aiDrawer.item;
  if (!item) return;
  const icon = renderFileIcon(item, { baseClass: "ai-context-icon" });
  const info = document.createElement("div");
  const title = document.createElement("strong");
  title.textContent = itemName(item);
  const meta = document.createElement("span");
  meta.textContent = `${item.type === "folder" ? "文件夹" : formatSize(item.size)} · ${formatTime(item.modifiedAt)}`;
  info.append(title, meta);
  const actions = document.createElement("div");
  actions.className = "ai-context-actions";
  actions.append(aiActionLink(item.type === "folder" ? "进入" : "预览", () => openItemFromAi(item)));
  if (item.type === "file") actions.append(aiActionLink("下载", () => downloadFile(item)));
  aiContextCard.append(icon, info, actions);
}

function renderAiSuggestions() {
  if (!aiSuggestionList) return;
  aiSuggestionList.replaceChildren();
  const suggestions = state.aiDrawer.mode === "global"
    ? [
        ["找毕业设计资料", "帮我找一下和毕业设计相关的资料"],
        ["最近的论文文件", "最近修改过的论文相关文件有哪些？"],
        ["整理资料结构", "把当前网盘资料按用途整理一下"],
      ]
    : [
        ["总结", "总结这个文件的主要内容"],
        ["提取重点", "提取这个文件的重点"],
        ["生成提纲", "根据这个文件生成一个汇报提纲"],
      ];
  for (const [label, prompt] of suggestions) {
    aiSuggestionList.append(aiSuggestionButton(label, prompt));
  }
}

function cleanSpecialAiTokens(text = "") {
  return String(text || "")
    .replace(/<[|｜]?\s*tool\s*calls?\s*(?:begin)?\s*[|｜]?>[\s\S]*?<[|｜]?\s*\/?\s*tool\s*calls?\s*(?:end)?\s*[|｜]?>/gi, "")
    .replace(/<[|｜]?\s*tool\s*call\s*(?:begin)?\s*[|｜]?>[\s\S]*?<[|｜]?\s*\/?\s*tool\s*call\s*(?:end)?\s*[|｜]?>/gi, "")
    .replace(/<[|｜]?\s*tool_calls?\s*(?:begin)?\s*[|｜]?>[\s\S]*?<[|｜]?\s*\/?\s*tool_calls?\s*(?:end)?\s*[|｜]?>/gi, "")
    .replace(/<[|｜]?\s*tool_call\s*(?:begin)?\s*[|｜]?>[\s\S]*?<[|｜]?\s*\/?\s*tool_call\s*(?:end)?\s*[|｜]?>/gi, "")
    .replace(/<\s*[|｜?\s]*DSML[|｜?\s]*tool_calls?\s*>[\s\S]*?<\s*\/\s*[|｜?\s]*DSML[|｜?\s]*tool_calls?\s*>/gi, "")
    .replace(/<\s*[|｜?\s]*DSML[|｜?\s]*tool_call\s*>[\s\S]*?<\s*\/\s*[|｜?\s]*DSML[|｜?\s]*tool_call\s*>/gi, "")
    .replace(/<[|｜]?\s*(?:begin|end)\s*of\s*(?:sentence|sequence|text)\s*[|｜]?>/gi, "")
    .replace(/<[|｜]?\s*tool\s*sep\s*[|｜]?>/gi, "")
    .replace(/<[|｜]?\s*tool_sep\s*[|｜]?>/gi, "")
    .trim();
}

function extractThinkingProcess(text = "", reasoning = "") {
  let mainText = cleanSpecialAiTokens(text || "");
  const thoughts = [];
  if (reasoning && String(reasoning).trim()) {
    thoughts.push(String(reasoning).trim());
  }
  mainText = mainText.replace(/<\s*think\s*>([\s\S]*?)<\s*\/\s*think\s*>/gi, (_, thought) => {
    if (thought.trim()) thoughts.push(thought.trim());
    return "";
  });
  const unclosedMatch = mainText.match(/<\s*think\s*>([\s\S]*)$/i);
  if (unclosedMatch) {
    if (unclosedMatch[1].trim()) thoughts.push(unclosedMatch[1].trim());
    mainText = mainText.replace(/<\s*think\s*>[\s\S]*$/i, "");
  }
  return {
    mainText: mainText.trim(),
    thoughtText: thoughts.join("\n\n").trim(),
  };
}

function escapeHtml(text = "") {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function appendInlineMarkdown(parent, text = "") {
  const pattern = /(\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*|~~([^~]+)~~|`([^`]+)`|\\\((.+?)\\\))/g;
  let lastIndex = 0;
  const str = String(text || "");
  for (const match of str.matchAll(pattern)) {
    if (match.index > lastIndex) {
      parent.append(document.createTextNode(str.slice(lastIndex, match.index)));
    }
    const token = match[0];
    if (match[2] && match[3]) {
      const a = document.createElement("a");
      a.href = match[3];
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.textContent = match[2];
      parent.append(a);
    } else if (match[4]) {
      const strong = document.createElement("strong");
      strong.textContent = match[4];
      parent.append(strong);
    } else if (match[5]) {
      const em = document.createElement("em");
      em.textContent = match[5];
      parent.append(em);
    } else if (match[6]) {
      const del = document.createElement("del");
      del.textContent = match[6];
      parent.append(del);
    } else if (match[7]) {
      const code = document.createElement("code");
      code.textContent = match[7];
      parent.append(code);
    } else if (match[8]) {
      const span = document.createElement("span");
      span.textContent = token;
      parent.append(span);
    }
    lastIndex = match.index + token.length;
  }
  if (lastIndex < str.length) {
    parent.append(document.createTextNode(str.slice(lastIndex)));
  }
}

function protectCodeAndMathSegments(text = "") {
  const codeSegments = [];
  let protectedText = String(text || "").replace(/(```[\s\S]*?```|`[^`\n]+`)/g, (match) => {
    const token = `XCODEBLOCKTOKEN${codeSegments.length}X`;
    codeSegments.push(match);
    return token;
  });

  const mathSegments = [];
  protectedText = protectedText.replace(/(\$\$[\s\S]+?\$\$|\\\[[\s\S]+?\\\]|\\\([\s\S]+?\\\)|\$(?!\s)[^\n$]+(?<!\s)\$)/g, (match) => {
    if (match.startsWith("$") && !match.startsWith("$$")) {
      const inner = match.slice(1, -1);
      if (/^\s*\d+(?:\.\d+)?\s*$/.test(inner)) return match;
    }
    const token = `XMATHTOKEN${mathSegments.length}X`;
    mathSegments.push(match);
    return token;
  });

  codeSegments.forEach((code, index) => {
    protectedText = protectedText.replaceAll(`XCODEBLOCKTOKEN${index}X`, code);
  });

  return { protectedText, mathSegments };
}

function normalizeAiMarkdownSource(text = "") {
  return String(text || "")
    .replace(/\r\n?/g, "\n")
    .replace(/\u00a0/g, " ")
    .replace(/([^\n])[\t ]+(#{1,6}[\t ]+\S)/g, "$1\n\n$2")
    .replace(/([^\n])[\t ]+(```)/g, "$1\n\n$2")
    .replace(/([^\n])[\t ]+(\d{1,2}[.)][\t ]+\S)/g, "$1\n$2")
    .replace(/([：:。；;])[\t ]+([-*+][\t ]+\S)/g, "$1\n$2")
    .replace(/([^\n])[\t ]+(\|[\t ]*:?-{3,}:?[\t ]*\|)/g, "$1\n$2")
    .trim();
}

function restoreMathSegments(html = "", mathSegments = []) {
  let output = String(html || "");
  mathSegments.forEach((segment, index) => {
    const token = `XMATHTOKEN${index}X`;
    const isDisplay = segment.startsWith("$$") || segment.startsWith("\\[");
    let formula = segment;
    if (segment.startsWith("$$")) formula = segment.slice(2, -2);
    else if (segment.startsWith("$")) formula = segment.slice(1, -1);
    else if (segment.startsWith("\\[")) formula = segment.slice(2, -2);
    else if (segment.startsWith("\\(")) formula = segment.slice(2, -2);
    const restored = isDisplay ? `\\[${escapeHtml(formula.trim())}\\]` : `\\(${escapeHtml(formula.trim())}\\)`;
    output = output.replaceAll(token, restored);
  });
  return output;
}

function renderMathInAiMessage(container) {
  if (typeof window.renderMathInElement !== "function") return;
  try {
    window.renderMathInElement(container, {
      delimiters: [
        { left: "$$", right: "$$", display: true },
        { left: "\\[", right: "\\]", display: true },
        { left: "\\(", right: "\\)", display: false },
        { left: "$", right: "$", display: false },
      ],
      ignoredTags: ["script", "noscript", "style", "textarea", "pre", "code"],
      throwOnError: false,
    });
  } catch (error) {
    console.warn("AI 数学公式渲染失败：", error.message);
  }
}

async function copyTextToClipboard(text) {
  if (!text) return false;
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {}
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.top = "-9999px";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    return Boolean(ok);
  } catch {
    return false;
  }
}

function enhanceCodeBlocksInContainer(container) {
  container.querySelectorAll("pre").forEach((pre) => {
    if (pre.closest(".ai-code-block-wrapper")) return;
    const code = pre.querySelector("code");
    const codeText = code ? code.textContent : pre.textContent;
    const langMatch = (code?.className || "").match(/language-([a-zA-Z0-9_-]+)/);
    const lang = langMatch ? langMatch[1] : "代码";

    const wrapper = document.createElement("div");
    wrapper.className = "ai-code-block-wrapper";

    const header = document.createElement("div");
    header.className = "ai-code-header";

    const langLabel = document.createElement("span");
    langLabel.className = "ai-code-lang";
    langLabel.textContent = lang;

    const copyBtn = document.createElement("button");
    copyBtn.type = "button";
    copyBtn.className = "ai-code-copy-btn";
    copyBtn.innerHTML = `
      <svg class="action-icon" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
      </svg>
      <span>复制代码</span>
    `;
    copyBtn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const ok = await copyTextToClipboard(codeText);
      if (ok) {
        copyBtn.innerHTML = `
          <svg class="action-icon" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          <span>已复制 ✓</span>
        `;
        copyBtn.classList.add("copied");
        setTimeout(() => {
          copyBtn.innerHTML = `
            <svg class="action-icon" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
            <span>复制代码</span>
          `;
          copyBtn.classList.remove("copied");
        }, 2000);
      } else {
        copyBtn.querySelector("span").textContent = "复制失败";
        setTimeout(() => {
          copyBtn.querySelector("span").textContent = "复制代码";
        }, 2000);
      }
    });

    header.append(langLabel, copyBtn);
    pre.parentNode.insertBefore(wrapper, pre);
    wrapper.append(header, pre);
  });
}

function renderFallbackMarkdown(text = "") {
  const container = document.createElement("div");
  const lines = String(text || "").replace(/\r\n/g, "\n").split("\n");
  let paragraph = [];
  let list = null;
  let codeBlock = null;
  let codeLang = "";

  const flushParagraph = () => {
    if (!paragraph.length) return;
    const p = document.createElement("p");
    appendInlineMarkdown(p, paragraph.join(" ").trim());
    container.append(p);
    paragraph = [];
  };

  const flushList = () => {
    if (!list) return;
    container.append(list);
    list = null;
  };

  const flushCodeBlock = () => {
    if (!codeBlock) return;
    const pre = document.createElement("pre");
    const code = document.createElement("code");
    if (codeLang) code.className = `language-${codeLang}`;
    code.textContent = codeBlock.join("\n");
    pre.append(code);
    container.append(pre);
    codeBlock = null;
    codeLang = "";
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trimEnd();
    const trimmed = line.trim();

    // Code block fences
    if (trimmed.startsWith("```")) {
      if (codeBlock) {
        flushCodeBlock();
      } else {
        flushParagraph();
        flushList();
        codeBlock = [];
        codeLang = trimmed.slice(3).trim();
      }
      continue;
    }

    if (codeBlock) {
      codeBlock.push(line);
      continue;
    }

    if (!trimmed) {
      flushParagraph();
      flushList();
      continue;
    }

    // Markdown Table detection in fallback
    if (trimmed.includes("|")) {
      const nextLine = (lines[i + 1] || "").trim();
      if (/^\|?[\s:-]+\|[\s:|-]*$/.test(nextLine)) {
        flushParagraph();
        flushList();
        const parseRow = (l) => {
          let c = l.trim();
          if (c.startsWith("|")) c = c.slice(1);
          if (c.endsWith("|")) c = c.slice(0, -1);
          return c.split("|").map((cell) => cell.trim());
        };
        const headers = parseRow(trimmed);
        const rows = [];
        i += 2;
        while (i < lines.length && lines[i].trim().includes("|")) {
          rows.push(parseRow(lines[i]));
          i++;
        }
        i--;
        const table = document.createElement("table");
        const thead = document.createElement("thead");
        const headerTr = document.createElement("tr");
        for (const h of headers) {
          const th = document.createElement("th");
          appendInlineMarkdown(th, h);
          headerTr.append(th);
        }
        thead.append(headerTr);
        table.append(thead);
        const tbody = document.createElement("tbody");
        for (const row of rows) {
          const tr = document.createElement("tr");
          for (let col = 0; col < headers.length; col++) {
            const td = document.createElement("td");
            appendInlineMarkdown(td, row[col] || "");
            tr.append(td);
          }
          tbody.append(tr);
        }
        table.append(tbody);
        container.append(table);
        continue;
      }
    }

    // Horizontal Rule
    if (/^[-*_]{3,}$/.test(trimmed)) {
      flushParagraph();
      flushList();
      container.append(document.createElement("hr"));
      continue;
    }

    // Headings
    const heading = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      flushParagraph();
      flushList();
      const level = Math.min(heading[1].length, 6);
      const title = document.createElement(`h${level}`);
      appendInlineMarkdown(title, heading[2]);
      container.append(title);
      continue;
    }

    // Lists
    const unordered = trimmed.match(/^[-*+]\s+(.+)$/);
    const ordered = trimmed.match(/^\d+[.)]\s+(.+)$/);
    if (unordered || ordered) {
      flushParagraph();
      const tag = ordered ? "ol" : "ul";
      if (!list || list.tagName.toLowerCase() !== tag) {
        flushList();
        list = document.createElement(tag);
      }
      const item = document.createElement("li");
      appendInlineMarkdown(item, (unordered || ordered)[1]);
      list.append(item);
      continue;
    }

    // Blockquote
    const quote = trimmed.match(/^>\s*(.+)$/);
    if (quote) {
      flushParagraph();
      flushList();
      const blockquote = document.createElement("blockquote");
      appendInlineMarkdown(blockquote, quote[1]);
      container.append(blockquote);
      continue;
    }

    paragraph.push(trimmed);
  }

  flushCodeBlock();
  flushParagraph();
  flushList();
  if (!container.childNodes.length && text) {
    const p = document.createElement("p");
    p.textContent = text;
    container.append(p);
  }
  return container;
}

function renderInnerMarkdown(text = "") {
  const container = document.createElement("div");
  const clean = cleanSpecialAiTokens(text || "");
  if (!clean.trim()) return container;

  if (window.marked?.parse) {
    try {
      const { protectedText, mathSegments } = protectCodeAndMathSegments(clean);
      const markdownText = normalizeAiMarkdownSource(protectedText);
      const rawHtml = window.marked.parse(markdownText, {
        async: false,
        breaks: true,
        gfm: true,
      });
      const safeHtml = window.DOMPurify?.sanitize
        ? window.DOMPurify.sanitize(rawHtml, {
            USE_PROFILES: { html: true },
            ADD_TAGS: ["details", "summary"],
            ADD_ATTR: ["align", "alt", "checked", "class", "disabled", "height", "loading", "open", "rel", "start", "target", "title", "width"],
          })
        : rawHtml;
      container.innerHTML = restoreMathSegments(safeHtml, mathSegments);
      container.querySelectorAll("a[href]").forEach((link) => {
        link.target = "_blank";
        link.rel = "noopener noreferrer";
      });
      container.querySelectorAll("img").forEach((image) => {
        image.loading = "lazy";
        image.decoding = "async";
      });
      enhanceCodeBlocksInContainer(container);
      renderMathInAiMessage(container);
      return container;
    } catch (error) {
      console.warn("AI Markdown 渲染遇到异常，使用增强备用引擎：", error.message);
    }
  }

  const fallback = renderFallbackMarkdown(clean);
  enhanceCodeBlocksInContainer(fallback);
  renderMathInAiMessage(fallback);
  return fallback;
}

function renderAiMarkdown(text = "", reasoning = "") {
  const container = document.createElement("div");
  container.className = "ai-markdown";

  const { mainText, thoughtText } = extractThinkingProcess(text, reasoning);

  if (thoughtText) {
    const thoughtBox = document.createElement("details");
    thoughtBox.className = "ai-thought-box";
    const summary = document.createElement("summary");
    summary.className = "ai-thought-summary";
    summary.innerHTML = `
      <span class="ai-thought-icon">💡</span>
      <strong class="ai-thought-title">深度思考过程</strong>
      <span class="ai-thought-badge">点击展开</span>
      <svg class="ai-thought-chevron" viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M4 6l4 4 4-4"/>
      </svg>
    `;
    const thoughtBody = document.createElement("div");
    thoughtBody.className = "ai-thought-body";
    thoughtBody.append(renderInnerMarkdown(thoughtText));
    thoughtBox.append(summary, thoughtBody);
    container.append(thoughtBox);
  }

  const answerNode = renderInnerMarkdown(mainText);
  while (answerNode.firstChild) {
    container.append(answerNode.firstChild);
  }

  return container;
}

function renderAiMessageActions(message, isLastAssistant) {
  const actions = document.createElement("div");
  actions.className = "ai-message-actions";

  const copyBtn = document.createElement("button");
  copyBtn.type = "button";
  copyBtn.className = "ai-msg-action-btn copy-btn";
  copyBtn.setAttribute("aria-label", "复制全文");
  copyBtn.title = "复制完整回答正文到剪贴板";
  copyBtn.innerHTML = `
    <svg class="action-icon" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
    </svg>
    <span>复制全文</span>
  `;
  copyBtn.addEventListener("click", async () => {
    const { mainText } = extractThinkingProcess(message.text, message.reasoning);
    const textToCopy = mainText || message.text || "";
    const ok = await copyTextToClipboard(textToCopy);
    if (ok) {
      copyBtn.classList.add("copied");
      copyBtn.innerHTML = `
        <svg class="action-icon" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        <span>已复制 ✓</span>
      `;
      window.setTimeout(() => {
        copyBtn.classList.remove("copied");
        copyBtn.innerHTML = `
          <svg class="action-icon" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
          <span>复制全文</span>
        `;
      }, 2000);
    }
  });
  actions.append(copyBtn);

  if (isLastAssistant) {
    const regenBtn = document.createElement("button");
    regenBtn.type = "button";
    regenBtn.className = "ai-msg-action-btn regen-btn";
    regenBtn.setAttribute("aria-label", "重新生成");
    regenBtn.title = "重新向大模型请求生成本条回答";
    regenBtn.innerHTML = `
      <svg class="action-icon" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M23 4v6h-6"></path>
        <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
      </svg>
      <span>重新生成</span>
    `;
    regenBtn.addEventListener("click", () => {
      regenerateLastAiAnswer();
    });
    actions.append(regenBtn);
  }

  return actions;
}

function createAiMessageBubble(message, index, total, lastCompletedAssistantIndex, isNew = false) {
  const bubble = document.createElement("div");
  const hasUserBefore = state.aiDrawer.messages.slice(0, index).some((m) => m.role === "user");
  const isInitialGreeting = Boolean(message.isInitial || (!hasUserBefore && message.role === "assistant"));
  bubble.className = `ai-message ${message.role === "user" ? "user" : "assistant"}${message.pending ? " pending" : ""}${isInitialGreeting ? " initial-greeting" : ""}${isNew ? " ai-msg-new" : ""}`;
  if (message.role === "assistant" && message.webSearch) {
    const webBadge = document.createElement("div");
    webBadge.className = `ai-web-search-badge ${message.webSearch.enabled ? "used" : "off"}${message.webSearch.error ? " error" : ""}`;
    if (!message.webSearch.enabled) {
      webBadge.textContent = "联网搜索：未开启";
    } else if (message.webSearch.error) {
      webBadge.textContent = `联网搜索：搜索失败 · ${message.webSearch.error}`;
    } else if (message.webSearch.skipped) {
      webBadge.textContent = "联网搜索：未使用 · 本次无需联网";
    } else if (message.webSearch.count > 0) {
      const pageText = message.webSearch.pagesRead ? ` · 已读 ${message.webSearch.pagesRead} 页正文` : "";
      webBadge.textContent = `联网搜索：已使用 · ${message.webSearch.count} 条结果${pageText}`;
    } else {
      webBadge.textContent = "联网搜索：未使用";
    }
    bubble.append(webBadge);
  }
  if (message.role === "assistant" && (message.model || typeof message.thinking === "boolean")) {
    const meta = document.createElement("div");
    meta.className = "ai-message-meta";
    const modeLabel = "思考";
    meta.innerHTML = `<span class="meta-icon">💡</span> ${escapeHtml(message.model || aiModelDisplayName())} · ${modeLabel}`;
    bubble.append(meta);
  }
  bubble.append(renderAiMarkdown(message.text, message.reasoning));
  if (message.role === "assistant" && message.webSearch?.sources?.length) {
    bubble.append(renderAiWebSources(message.webSearch.sources));
  }
  if (message.results?.length) {
    const resultList = document.createElement("div");
    resultList.className = "ai-result-list";
    for (const item of message.results) {
      resultList.append(renderAiResultCard(item));
    }
    bubble.append(resultList);
  }
  if (message.role === "assistant" && !message.pending && !isInitialGreeting && message.text) {
    const isLast = index === lastCompletedAssistantIndex;
    bubble.append(renderAiMessageActions(message, isLast));
  }
  return bubble;
}

function renderAiMessages() {
  if (!aiMessages) return;
  aiMessages.replaceChildren();
  const total = state.aiDrawer.messages.length;
  let lastCompletedAssistantIndex = -1;
  for (let i = total - 1; i >= 0; i--) {
    const m = state.aiDrawer.messages[i];
    if (m.role === "assistant" && !m.pending && m.text) {
      lastCompletedAssistantIndex = i;
      break;
    }
  }

  state.aiDrawer.messages.forEach((message, index) => {
    aiMessages.append(createAiMessageBubble(message, index, total, lastCompletedAssistantIndex, false));
  });
  requestAnimationFrame(() => {
    if (aiMessages) aiMessages.scrollTop = aiMessages.scrollHeight;
  });
}

function renderAiWebSources(sources = []) {
  const details = document.createElement("details");
  details.className = "ai-web-sources";
  const summary = document.createElement("summary");
  summary.textContent = `联网来源：${sources.length} 条`;
  details.append(summary);
  const list = document.createElement("ol");
  for (const source of sources) {
    const item = document.createElement("li");
    const link = document.createElement("a");
    link.href = source.url || "#";
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = source.title || source.url || "来源链接";
    item.append(link);
    const meta = document.createElement("span");
    meta.className = `ai-web-source-state ${source.pageRead ? "read" : "unread"}`;
    meta.textContent = source.pageRead ? "已读正文" : (source.pageError ? "正文未读" : "摘要");
    item.append(meta);
    if (source.snippet) {
      const snippet = document.createElement("p");
      snippet.textContent = source.snippet;
      item.append(snippet);
    }
    list.append(item);
  }
  details.append(list);
  return details;
}

function renderAiResultCard(item) {
  syncAiResultItemLockState(item);
  const card = document.createElement("article");
  card.className = "ai-result-card";
  const title = document.createElement("strong");
  title.textContent = itemName(item);
  const meta = document.createElement("span");
  meta.textContent = `${item.type === "folder" ? "文件夹" : formatSize(item.size)} · ${displayFolder(parentPath(item.path)) || "全部文件"}`;
  const reason = document.createElement("p");
  reason.textContent = item.matchReason ? `相关原因：${item.matchReason}` : "相关原因：名称、路径或当前上下文可能相关";
  const actions = document.createElement("div");
  actions.className = "ai-result-actions";
  if (lockedFolderForAiItem(item)) {
    reason.textContent = `${reason.textContent}；需要先解锁后才能查看内部内容`;
    actions.append(aiActionLink("解锁", () => openItemFromAi(item), "ai-result-primary"));
  } else {
    if (item.type === "folder" && item.locked) {
      reason.textContent = `${reason.textContent}；已加密，当前已解锁`;
    }
    actions.append(aiActionLink(item.type === "folder" ? "进入" : "预览", () => openItemFromAi(item)));
    actions.append(aiActionLink("AI对话", () => openAiDrawer("item", item, { returnToCurrent: true }), "ai-result-primary"));
  }
  card.append(title, meta, reason, actions);
  return card;
}

function aiSuggestionScopeItems() {
  if (state.searchActive && state.searchRawItems.length) return state.searchRawItems;
  return state.items;
}

function aiSuggestionScopeLabel() {
  if (state.searchActive && state.searchQuery) return `当前搜索结果「${state.searchQuery}」`;
  return displayFolder(state.path || "") || "全部文件";
}

function aiSuggestionBaseName(item) {
  return String(itemName(item) || "")
    .replace(/\.[^.\\/]+$/, "")
    .replace(/[_-]+/g, " ")
    .trim();
}

function aiSuggestionFileText(item) {
  return [item?.name, item?.displayName, itemName(item), item?.path]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function aiSuggestionExtension(item) {
  const source = [item?.name, item?.displayName, itemName(item), item?.path]
    .filter(Boolean)
    .find((value) => /\.[^./\\\s]+$/.test(String(value || "").trim()));
  const match = String(source || "").trim().toLowerCase().match(/\.([^./\\\s]+)$/);
  return match ? match[1] : "";
}

function aiSuggestionCategory(item) {
  const name = aiSuggestionFileText(item);
  if (item.type === "folder") return "folder";
  const ext = aiSuggestionExtension(item);
  if (["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg", "tif", "tiff"].includes(ext)) return "images";
  if (["xls", "xlsx", "csv"].includes(ext)) return "sheets";
  if (["ppt", "pptx"].includes(ext)) return "slides";
  if (["mp4", "mov", "mkv", "webm", "avi", "flv", "wmv", "m4v"].includes(ext)) return "video";
  if (["mp3", "wav", "flac", "ogg", "m4a", "aac"].includes(ext)) return "audio";
  if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) return "archive";
  if (["txt", "md", "markdown", "log"].includes(ext)) return "text";
  if (["pdf", "doc", "docx", "rtf", "odt"].includes(ext)) return "docs";
  if (["js", "ts", "jsx", "tsx", "py", "java", "c", "cpp", "cs", "go", "rs", "html", "css", "json", "xml", "yaml", "yml", "sh", "bat", "ps1"].includes(ext)) return "code";
  if (/图片|照片|图像|素材|截图|插图|image|photo|figure/i.test(name)) return "images";
  if (/表格|数据表|统计表|excel|sheet|表单|数据集/i.test(name)) return "sheets";
  if (/ppt|演示|汇报|答辩|presentation|slides?/i.test(name)) return "slides";
  if (/视频|录屏|剪辑|video/i.test(name)) return "video";
  if (/音频|录音|语音|audio/i.test(name)) return "audio";
  if (/代码|脚本|配置|源码|程序|api|dev|build/i.test(name)) return "code";
  if (/压缩|备份|archive|backup/i.test(name)) return "archive";
  if (/笔记|记录|日志|文本|说明|readme|note|memo/i.test(name)) return "text";
  if (/论文|毕业|报告|文档|总结|计划|thesis|paper|report|document/i.test(name)) return "docs";
  return "file";
}

function buildAiSuggestionItems() {
  const activeItem = state.aiDrawer.item;
  if (state.aiDrawer.mode === "item" && activeItem) {
    const targetName = itemName(activeItem);
    if (activeItem.type === "folder") {
      return [
        ["整理文件夹", `帮我整理“${targetName}”这个文件夹里的资料结构。`],
        ["找重点文件", `帮我找“${targetName}”里最值得先看的文件。`],
        ["按用途分类", `帮我把“${targetName}”里的资料按用途分类。`],
      ];
    }

    const category = aiSuggestionCategory(activeItem);
    if (category === "video") return [];
    if (category === "images") {
      return [
        ["描述图片", `描述“${targetName}”这张图片的主要内容。`],
        ["提取信息", `从“${targetName}”里提取可见的关键信息。`],
        ["生成说明", `根据“${targetName}”生成一段图片说明。`],
      ];
    }
    if (category === "slides") {
      return [
        ["总结PPT", `总结“${targetName}”这份PPT的主要内容。`],
        ["提取大纲", `提取“${targetName}”的汇报大纲。`],
        ["答辩要点", `根据“${targetName}”整理答辩要点。`],
      ];
    }
    if (category === "sheets") {
      return [
        ["概览表格", `概览“${targetName}”这个表格的数据内容。`],
        ["提取字段", `提取“${targetName}”里的关键字段和数据重点。`],
        ["分析数据", `根据“${targetName}”做一个轻度数据分析。`],
      ];
    }
    if (category === "docs") {
      return [
        ["总结文档", `总结“${targetName}”这份文档的主要内容。`],
        ["提取重点", `提取“${targetName}”里的核心观点和重点信息。`],
        ["生成提纲", `根据“${targetName}”生成一份简洁提纲。`],
      ];
    }
    if (category === "text") {
      return [
        ["整理文本", `整理“${targetName}”这份文本的主要内容。`],
        ["提取要点", `提取“${targetName}”里的关键信息。`],
        ["生成摘要", `为“${targetName}”生成一段简洁摘要。`],
      ];
    }
    if (category === "code") {
      return [
        ["解释代码", `解释“${targetName}”这份代码或配置的作用。`],
        ["找关键逻辑", `找出“${targetName}”里的关键逻辑。`],
        ["检查问题", `帮我检查“${targetName}”里可能存在的问题。`],
      ];
    }
    if (category === "audio") {
      return [
        ["识别信息", `根据“${targetName}”可读取的信息，说明这个音频文件的基本情况。`],
        ["整理线索", `围绕“${targetName}”整理可用的文件线索。`],
        ["使用建议", `告诉我“${targetName}”这个音频文件适合怎么使用。`],
      ];
    }
    if (category === "archive") {
      return [
        ["说明压缩包", `根据文件信息说明“${targetName}”这个压缩包可能包含什么。`],
        ["整理用途", `分析“${targetName}”这个压缩包可能适合什么用途。`],
        ["处理建议", `给出“${targetName}”这个压缩包的后续处理建议。`],
      ];
    }
    return [
      ["总结文件", `总结“${targetName}”这个文件的主要内容。`],
      ["提取重点", `提取“${targetName}”里的重点信息。`],
      ["生成提纲", `根据“${targetName}”生成一份简洁提纲。`],
    ];
  }

  const items = aiSuggestionScopeItems();
  if (!items.length) {
    return state.aiDrawer.mode === "global"
      ? [
          ["整理结构", "帮我梳理当前文件夹的资料结构，并列出最值得先看的文件夹。"],
          ["查找文档", "帮我找和当前文件夹相关的文档、报告或论文资料。"],
          ["筛选素材", "帮我筛选当前文件夹里可能有用的图片、表格或其他素材。"],
        ]
      : [
          ["总结", "总结这个文件的主要内容。"],
          ["提取重点", "提取这个文件的重点信息。"],
          ["生成提纲", "根据这个文件生成一个提纲。"],
        ];
  }

  const scopeLabel = aiSuggestionScopeLabel();
  const folderNames = [];
  const categoryCounts = new Map();

  for (const item of items) {
    const category = aiSuggestionCategory(item);
    categoryCounts.set(category, (categoryCounts.get(category) || 0) + 1);
    if (item.type === "folder") {
      const baseName = aiSuggestionBaseName(item);
      if (baseName && folderNames.length < 3 && !folderNames.includes(baseName)) {
        folderNames.push(baseName);
      }
    }
  }

  const categoryMeta = {
    folder: { label: "整理结构", prompt: `帮我梳理当前范围「${scopeLabel}」的资料结构，并列出最值得先看的文件夹。`, weight: 6 },
    docs: { label: "找文档", prompt: "帮我找当前范围里和论文、报告、说明文档相关的资料，并按相关性排序。", weight: 5 },
    sheets: { label: "找表格", prompt: "帮我找当前范围里的表格、数据文件，并说明它们各自适合做什么。", weight: 4 },
    images: { label: "找图片", prompt: "帮我筛选当前范围里的图片、截图或插图素材，并列出最相关的文件。", weight: 4 },
    slides: { label: "找PPT", prompt: "帮我找当前范围里的PPT、汇报或答辩材料。", weight: 4 },
    code: { label: "找脚本", prompt: "帮我梳理当前范围里的脚本、代码或配置文件，并告诉我哪些最重要。", weight: 4 },
    text: { label: "找文本", prompt: "帮我找当前范围里的TXT、Markdown、日志或笔记文本，并列出最相关的文件。", weight: 4 },
    video: { label: "找视频", prompt: "帮我找当前范围里的视频或录屏文件。", weight: 3 },
    audio: { label: "找音频", prompt: "帮我找当前范围里的音频或录音文件。", weight: 3 },
    archive: { label: "找压缩包", prompt: "帮我找当前范围里的压缩包或备份文件，并说明里面可能有什么。", weight: 2 },
    file: { label: "找文件", prompt: "帮我按名称、路径和类型整理当前范围里的普通文件。", weight: 1 },
  };

  const ranked = [...categoryCounts.entries()]
    .filter(([category]) => category !== "other")
    .sort((left, right) => {
      const leftWeight = categoryMeta[left[0]]?.weight || 0;
      const rightWeight = categoryMeta[right[0]]?.weight || 0;
      if (right[1] !== left[1]) return right[1] - left[1];
      if (rightWeight !== leftWeight) return rightWeight - leftWeight;
      return left[0].localeCompare(right[0]);
    });

  const suggestions = [];
  const seen = new Set();
  const pushSuggestion = (label, prompt) => {
    const key = `${label}|${prompt}`;
    if (seen.has(key)) return;
    seen.add(key);
    suggestions.push([label, prompt]);
  };

  if (folderNames.length) {
    pushSuggestion(`看${folderNames[0]}`, `帮我看看当前范围里“${folderNames[0]}”这个文件夹相关的资料，并告诉我应该先看哪些内容。`);
  }
  if (state.aiDrawer.mode === "global") {
    pushSuggestion("整理结构", `帮我梳理当前范围「${scopeLabel}」的资料结构，并列出最值得先看的文件夹。`);
  }

  for (const [category] of ranked) {
    const meta = categoryMeta[category];
    if (!meta) continue;
    pushSuggestion(meta.label, meta.prompt);
    if (suggestions.length >= 3) break;
  }

  const fallbackSuggestions = [
    ["整理结构", `帮我梳理当前范围「${scopeLabel}」的资料结构。`],
    ["找文档", "帮我找当前范围里最相关的文档。"],
    ["提取重点", "帮我提取当前范围里最值得关注的信息。"],
  ];
  for (const [label, prompt] of fallbackSuggestions) {
    if (suggestions.length >= 3) break;
    pushSuggestion(label, prompt);
  }

  if (!suggestions.length) {
    return state.aiDrawer.mode === "global"
      ? [
          ["整理结构", `帮我梳理当前范围「${scopeLabel}」的资料结构。`],
          ["找文档", "帮我找当前范围里最相关的文档。"],
          ["提取重点", "帮我提取当前范围里最值得关注的信息。"],
        ]
      : [
          ["总结", "总结这个文件的主要内容。"],
          ["提取重点", "提取这个文件的重点信息。"],
          ["生成提纲", "根据这个文件生成一个提纲。"],
        ];
  }
  return suggestions.slice(0, 3);
}

function renderAiSuggestionsDynamic() {
  if (!aiSuggestionList) return;
  aiSuggestionList.replaceChildren();
  for (const [label, prompt] of buildAiSuggestionItems()) {
    aiSuggestionList.append(aiSuggestionButton(label, prompt));
  }
}

function renderAiDrawer() {
  const isItemMode = state.aiDrawer.mode === "item";
  const item = state.aiDrawer.item;
  const currentScope = getCurrentAiScope();
  if (aiDrawerTitle) {
    let titleText = "";
    if (isItemMode) {
      titleText = item?.type === "folder" ? "AI文件夹对话" : "AI文件对话";
    } else {
      titleText = currentScope.type === "folder" ? "AI文件夹对话" : "AI全库问答";
    }
    aiDrawerTitle.innerHTML = `<span class="title-text">${titleText}</span><span class="model-badge">${escapeHtml(aiModelDisplayName())}</span>`;
  }
  if (aiDrawerSubtitle) {
    aiDrawerSubtitle.textContent = "";
    aiDrawerSubtitle.style.display = "none";
  }
  state.aiDrawer.model = "reasoner";
  aiModelReasonerBtn?.classList.add("active");
  syncAiWebSearchUi();
  const drawerHeader = aiDrawer?.querySelector(".ai-drawer-header");
  if (aiDrawerBackBtn) {
    if (isItemMode && state.aiDrawer.returnTo) {
      aiDrawerBackBtn.classList.remove("hidden");
      aiDrawerBackBtn.textContent = state.aiDrawer.returnTo.mode === "global" && state.path ? "返回文件夹" : "返回全库问答";
      aiDrawerBackBtn.title = "返回上一个对话";
      drawerHeader?.classList.add("has-back-btn");
    } else if (Boolean(state.path) && !isItemMode) {
      aiDrawerBackBtn.classList.remove("hidden");
      if (state.aiDrawer.forceGlobal) {
        aiDrawerBackBtn.textContent = "当前文件夹";
        aiDrawerBackBtn.title = `缩小检索范围，仅围绕当前文件夹（${displayFolder(state.path)}）提问`;
      } else {
        aiDrawerBackBtn.textContent = "全库问答";
        aiDrawerBackBtn.title = "扩大检索范围，向整个网盘提问";
      }
      drawerHeader?.classList.add("has-back-btn");
    } else {
      aiDrawerBackBtn.classList.add("hidden");
      drawerHeader?.classList.remove("has-back-btn");
    }
  }
  if (aiScopeBtn) {
    let scopeIcon = "📁";
    let scopeText = "全部文件";
    let scopeFull = "全部文件";

    if (isItemMode && item) {
      if (item.type === "folder") {
        scopeIcon = "📂";
        scopeText = `文件夹：${itemName(item)}`;
        scopeFull = item.path ? `全部文件 / ${item.path}` : itemName(item);
      } else {
        scopeIcon = "📄";
        scopeText = "当前文件";
        scopeFull = item.path ? `全部文件 / ${item.path}` : itemName(item);
      }
    } else if (currentScope.type === "folder") {
      const folderName = displayFolder(state.path || "") || "当前文件夹";
      scopeIcon = "📂";
      scopeText = `文件夹：${folderName}`;
      scopeFull = state.path ? `全部文件 / ${state.path}` : folderName;
    } else {
      scopeIcon = "📁";
      scopeText = "全部文件";
      scopeFull = "全部文件";
    }

    const iconEl = aiScopeBtn.querySelector(".pill-icon");
    const labelEl = aiScopeBtn.querySelector(".pill-label");
    if (iconEl) iconEl.textContent = scopeIcon;
    if (labelEl) labelEl.textContent = scopeText;
    else aiScopeBtn.textContent = scopeText;

    aiScopeBtn.title = `范围：${scopeFull}`;
  }
  if (aiPromptHint) {
    aiPromptHint.textContent = isItemMode
      ? (item?.type === "folder" ? "围绕当前文件夹提问" : "围绕当前文件提问")
      : (currentScope.type === "folder" ? "围绕当前文件夹提问" : "问问整个网盘");
  }
  if (aiPromptInput) {
    aiPromptInput.placeholder = isItemMode
      ? (item?.type === "folder" ? "例如：梳理包含哪些资料、查找核心文档..." : "例如：总结重点、提炼核心结论、寻找数据...")
      : (currentScope.type === "folder" ? "例如：梳理当前文件夹资料、按类型总结..." : "例如：帮我找毕业设计相关资料");
  }
  renderAiContextCard();
  renderAiSuggestionsDynamic();
  renderAiMessages();
}

async function requestAiAssistant({ mode, item, prompt, signal }) {
  const path = mode === "item" ? item?.path || "" : (state.aiDrawer?.forceGlobal ? "" : state.path || "");
  const messages = state.aiDrawer.messages
    .slice(-10)
    .filter((message) => !message.pending)
    .map((message) => ({ role: message.role, text: message.text }))
    .filter((message) => message.text);
  return api("/api/ai/chat", {
    method: "POST",
    signal,
    body: JSON.stringify({
      mode,
      model: "reasoner",
      path,
      prompt,
      webSearchEnabled: state.aiWebSearchEnabled,
      messages,
    }),
  });
}

async function executeAiChatTurn(prompt) {
  const pendingMessage = {
    role: "assistant",
    text: aiPendingText(prompt, state.aiDrawer.mode, state.aiWebSearchEnabled),
    pending: true,
    pendingStageTimers: [],
  };
  state.aiDrawer.messages.push(pendingMessage);

  const total = state.aiDrawer.messages.length;
  if (aiMessages && aiMessages.children.length === total - 2) {
    const userMsg = state.aiDrawer.messages[total - 2];
    aiMessages.append(
      createAiMessageBubble(userMsg, total - 2, total, -1, true),
      createAiMessageBubble(pendingMessage, total - 1, total, -1, true)
    );
    aiMessages.scrollTop = aiMessages.scrollHeight;
  } else {
    renderAiMessages();
  }

  scheduleAiPendingStages(pendingMessage, prompt, state.aiDrawer.mode, state.aiWebSearchEnabled);

  isAiGenerating = true;
  aiChatAbortController = new AbortController();
  aiPromptSendBtn?.removeAttribute("disabled");
  aiPromptSendBtn?.classList.add("is-generating");
  if (aiPromptSendBtn) {
    aiPromptSendBtn.setAttribute("aria-label", "停止生成");
    aiPromptSendBtn.title = "点击停止生成当前回答";
    aiPromptSendBtn.innerHTML = AI_STOP_SQUARE_SVG;
  }
  syncAiPromptSendState();

  try {
    const response = await requestAiAssistant({
      mode: state.aiDrawer.mode,
      item: state.aiDrawer.item,
      prompt,
      signal: aiChatAbortController.signal,
    });
    clearAiPendingTimers(pendingMessage);
    const msgIdx = state.aiDrawer.messages.indexOf(pendingMessage);
    const completedMsg = {
      role: "assistant",
      text: response.text,
      reasoning: response.reasoning || "",
      results: response.results || [],
      model: response.model || aiModelDisplayName(),
      thinking: Boolean(response.thinking || response.reasoning),
      webSearch: response.webSearch || null,
    };
    if (msgIdx !== -1) {
      state.aiDrawer.messages[msgIdx] = completedMsg;
    } else {
      state.aiDrawer.messages.push(completedMsg);
    }
    saveAiConversation();
    archiveCurrentAiSession();

    const pendingEl = aiMessages?.querySelector(".ai-message.pending");
    if (pendingEl) {
      const newBubble = createAiMessageBubble(completedMsg, msgIdx, state.aiDrawer.messages.length, msgIdx, true);
      pendingEl.replaceWith(newBubble);
      aiMessages.scrollTop = aiMessages.scrollHeight;
    } else {
      renderAiMessages();
    }
  } catch (error) {
    clearAiPendingTimers(pendingMessage);
    const msgIdx = state.aiDrawer.messages.indexOf(pendingMessage);
    const errText = isAbortError(error) ? "已停止生成当前回答。" : (error.message || "AI 回复失败，请稍后再试。");
    const errMessage = {
      role: "assistant",
      text: errText,
      results: [],
      model: aiModelDisplayName(),
    };
    if (msgIdx !== -1) {
      state.aiDrawer.messages[msgIdx] = errMessage;
    } else {
      state.aiDrawer.messages.push(errMessage);
    }
    if (isAbortError(error)) {
      setStatus("已停止生成");
    }
    saveAiConversation();
    archiveCurrentAiSession();

    const pendingEl = aiMessages?.querySelector(".ai-message.pending");
    if (pendingEl) {
      const newBubble = createAiMessageBubble(errMessage, msgIdx, state.aiDrawer.messages.length, msgIdx, true);
      pendingEl.replaceWith(newBubble);
      aiMessages.scrollTop = aiMessages.scrollHeight;
    } else {
      renderAiMessages();
    }
  } finally {
    clearAiPendingTimers(pendingMessage);
    isAiGenerating = false;
    aiChatAbortController = null;
    aiPromptSendBtn?.classList.remove("is-generating");
    if (aiPromptSendBtn) {
      aiPromptSendBtn.removeAttribute("disabled");
      aiPromptSendBtn.setAttribute("aria-label", "发送提问");
      aiPromptSendBtn.title = "发送提问 (Enter 发送，Shift+Enter 换行)";
      aiPromptSendBtn.innerHTML = AI_SEND_ARROW_SVG;
    }
    syncAiPromptSendState();
    autoResizeAiPromptInput();
    void flushPendingRealtimeRefresh();
  }
}

function regenerateLastAiAnswer() {
  if (isAiGenerating) return;
  let lastUserIndex = -1;
  for (let i = state.aiDrawer.messages.length - 1; i >= 0; i--) {
    if (state.aiDrawer.messages[i].role === "user") {
      lastUserIndex = i;
      break;
    }
  }
  if (lastUserIndex === -1) return;
  const prompt = state.aiDrawer.messages[lastUserIndex].text;
  state.aiDrawer.messages = state.aiDrawer.messages.slice(0, lastUserIndex + 1);
  saveAiConversation();
  archiveCurrentAiSession();
  renderAiMessages();
  void executeAiChatTurn(prompt);
  setStatus("正在重新生成回答...");
}

async function submitAiPrompt() {
  if (isAiGenerating) {
    if (aiChatAbortController) {
      aiChatAbortController.abort();
    }
    return;
  }
  const prompt = aiPromptInput?.value.trim() || "";
  if (!prompt) {
    aiPromptInput?.focus();
    syncAiPromptSendState();
    return;
  }
  closeAiHistoryPanel();
  state.aiDrawer.messages.push({ role: "user", text: prompt });
  saveAiConversation();
  archiveCurrentAiSession();
  if (aiPromptInput) {
    aiPromptInput.value = "";
    autoResizeAiPromptInput();
  }
  syncAiPromptSendState();
  await executeAiChatTurn(prompt);
}

function renderAccessInfo(data) {
  const client = data.clientNetwork || {};
  const accessType = client.accessType || (client.isLocal ? "local" : client.sameLan ? "lan" : "public");
  const accessLabel = accessType === "local" ? "本机访问" : accessType === "lan" ? "局域网访问" : "公网访问";
  const badgeLabel = accessType === "local" ? "本机" : accessType === "lan" ? "局域网" : "公网";

  const accessStatusBadge = document.getElementById("accessStatusBadge");
  const accessStatusBadgeText = document.getElementById("accessStatusBadgeText");
  if (accessStatusBadge && accessStatusBadgeText) {
    accessStatusBadge.className = `access-status-badge status-${accessType}`;
    accessStatusBadgeText.textContent = badgeLabel;
    accessStatusBadge.title = `当前连接类型：${accessLabel}`;
  }

  if (networkStatus) {
    networkStatus.classList.remove("local", "lan", "public");
    networkStatus.classList.add(accessType);
    const currentUrl = accessType === "local"
      ? `${window.location.protocol}//${window.location.host}`
      : accessType === "lan"
      ? `${window.location.protocol}//${window.location.host}`
      : (data.publicUrl || `${window.location.protocol}//${window.location.host}`);
    const labelNode = document.createElement("span");
    const statusNode = document.createElement("strong");
    const urlNode = document.createElement("code");
    labelNode.textContent = "当前访问";
    statusNode.textContent = accessLabel;
    urlNode.textContent = currentUrl;
    networkStatus.replaceChildren(labelNode, statusNode, urlNode);
    networkStatus.title = accessType === "local"
      ? "当前页面正在服务器本机访问网盘。"
      : accessType === "lan"
      ? "当前页面正在通过局域网地址访问网盘。"
      : "当前页面正在通过公网域名访问网盘。";
  }
  if (activeClientCount) {
    const active = data.activeClients || {};
    const count = Number.isFinite(Number(active.count)) ? Number(active.count) : 0;
    const minutes = Number.isFinite(Number(active.windowMinutes)) ? Number(active.windowMinutes) : 10;
    activeClientCount.textContent = `近 ${minutes} 分钟访问 IP：${count}`;
  }
  if (publicAccessLink && data.publicUrl) {
    publicAccessLink.href = withAuthParam(data.publicUrl);
    publicAccessLink.textContent = `公网备用：${data.publicUrl}`;
  }
  if (!lanAccessLinks) return;
  lanAccessLinks.innerHTML = "";
  const lan = Array.isArray(data.lan) ? data.lan : [];
  if (!lan.length) {
    const empty = document.createElement("small");
    empty.textContent = "未检测到可用局域网地址";
    lanAccessLinks.append(empty);
    return;
  }
  for (const entry of lan) {
    const link = document.createElement("a");
    link.href = withAuthParam(entry.url);
    link.textContent = `局域网优先：${entry.url}`;
    link.title = entry.name || entry.address || entry.url;
    lanAccessLinks.append(link);
  }
}

const ACCESS_BOX_COLLAPSED_KEY = "dpsir_access_box_collapsed";

function setupAccessBoxCollapsible() {
  const accessBox = document.getElementById("accessBox");
  const toggleBtn = document.getElementById("accessBoxToggle");
  if (!accessBox || !toggleBtn) return;

  // 默认收起 (collapsed = true)，若用户主动展开/收起则在 localStorage 中记忆
  const savedState = localStorage.getItem(ACCESS_BOX_COLLAPSED_KEY);
  const isCollapsed = savedState === null ? true : savedState === "true";

  if (isCollapsed) {
    accessBox.classList.add("collapsed");
    toggleBtn.setAttribute("aria-expanded", "false");
  } else {
    accessBox.classList.remove("collapsed");
    toggleBtn.setAttribute("aria-expanded", "true");
  }

  const toggle = (e) => {
    // 如果点击的是链接或复制操作，不触发折叠
    if (e && e.target && e.target.closest("a, code, .network-status")) {
      return;
    }
    const willCollapse = !accessBox.classList.contains("collapsed");
    accessBox.classList.toggle("collapsed", willCollapse);
    toggleBtn.setAttribute("aria-expanded", String(!willCollapse));
    try {
      localStorage.setItem(ACCESS_BOX_COLLAPSED_KEY, String(willCollapse));
    } catch {}
  };

  toggleBtn.addEventListener("click", toggle);
  toggleBtn.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggle();
    }
  });

  // 收起状态下，点击卡片任意非禁用区域即可展开
  accessBox.addEventListener("click", (e) => {
    if (accessBox.classList.contains("collapsed") && !e.target.closest("#accessBoxToggle")) {
      toggle(e);
    }
  });
}

function isLanHost(hostname) {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    /^10\./.test(hostname) ||
    /^192\.168\./.test(hostname) ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname)
  );
}

function withAuthParam(targetUrl) {
  const token = sessionToken();
  const url = new URL(targetUrl);
  if (token) url.searchParams.set("auth", token);
  return url.toString();
}

async function probeLanUrl(url) {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), LAN_AUTO_SWITCH_TIMEOUT_MS);
  try {
    const response = await fetch(`${url.replace(/\/$/, "")}/api/me`, {
      headers: authHeaders(),
      credentials: "include",
      cache: "no-store",
      signal: controller.signal,
    });
    if (!response.ok) return null;
    const data = await response.json().catch(() => null);
    return data?.authenticated ? url : null;
  } catch {
    return null;
  } finally {
    window.clearTimeout(timer);
  }
}

async function autoSwitchToLan(data) {
  if (state.lanSwitching || !sessionToken()) return;
  if (isLanHost(window.location.hostname)) return;
  const lastSwitch = Number(sessionStorage.getItem(LAN_AUTO_SWITCH_KEY) || 0);
  if (Date.now() - lastSwitch < 10000) return;
  const lan = Array.isArray(data?.lan) ? data.lan : [];
  const candidates = lan
    .map((entry) => entry?.url)
    .filter(Boolean)
    .filter((url) => {
      try {
        return isLanHost(new URL(url).hostname);
      } catch {
        return false;
      }
    });
  if (!candidates.length) return;

  state.lanSwitching = true;
  const probes = candidates.map((url) => probeLanUrl(url));
  const results = await Promise.all(probes);
  const target = results.find(Boolean);
  state.lanSwitching = false;
  if (!target) return;

  sessionStorage.setItem(LAN_AUTO_SWITCH_KEY, String(Date.now()));
  const currentPath = new URLSearchParams(window.location.search).get("path") || state.path || "";
  const targetUrl = new URL(target);
  targetUrl.pathname = "/";
  if (currentPath) targetUrl.searchParams.set("path", currentPath);
  window.location.replace(withAuthParam(targetUrl.toString()));
}

function publicFallbackUrl() {
  const href = publicAccessLink?.getAttribute("href") || publicAccessLink?.href || "";
  try {
    const url = new URL(href || window.location.origin, window.location.origin);
    url.pathname = "/";
    url.search = "";
    return url.toString();
  } catch {
    return window.location.origin + "/";
  }
}

function switchToPublicIfLanFailed() {
  if (!sessionToken() || !isLanHost(window.location.hostname)) return;
  const lastSwitch = Number(sessionStorage.getItem(LAN_AUTO_SWITCH_KEY) || 0);
  if (Date.now() - lastSwitch < 10000) return;
  sessionStorage.setItem(LAN_AUTO_SWITCH_KEY, String(Date.now()));
  window.location.replace(withAuthParam(publicFallbackUrl()));
}

async function fetchAccessInfo() {
  state.accessInfoController?.abort();
  const controller = new AbortController();
  state.accessInfoController = controller;
  const timer = window.setTimeout(() => controller.abort(), ACCESS_INFO_TIMEOUT_MS);
  try {
    const data = await api("/api/access-info", { cache: "no-store", signal: controller.signal });
    return data;
  } finally {
    window.clearTimeout(timer);
    if (state.accessInfoController === controller) state.accessInfoController = null;
  }
}

async function refreshAccessInfo({ allowSwitch = true } = {}) {
  const requestSeq = ++state.accessInfoRequestSeq;
  state.lastAccessInfoRefreshAt = Date.now();
  try {
    const data = await fetchAccessInfo();
    if (requestSeq !== state.accessInfoRequestSeq) return;
    renderAccessInfo(data);
    if (allowSwitch) await autoSwitchToLan(data);
  } catch {
    if (requestSeq !== state.accessInfoRequestSeq) return;
    if (lanAccessLinks) {
      lanAccessLinks.innerHTML = "";
      const empty = document.createElement("small");
      empty.textContent = "登录后显示当前局域网地址";
      lanAccessLinks.append(empty);
    }
    if (allowSwitch) switchToPublicIfLanFailed();
  }
}

function refreshAccessInfoSoon(options = {}) {
  if (state.accessInfoRefreshQueued || driveView.classList.contains("hidden")) return;
  const wait = Math.max(0, ACCESS_INFO_QUICK_REFRESH_GAP_MS - (Date.now() - state.lastAccessInfoRefreshAt));
  state.accessInfoRefreshQueued = true;
  window.setTimeout(() => {
    state.accessInfoRefreshQueued = false;
    if (driveView.classList.contains("hidden")) return;
    refreshAccessInfo(options);
  }, wait);
}

async function refreshStorageUsage() {
  if (!storageUsed) return;
  state.lastStorageUsageRefreshAt = Date.now();
  try {
    const data = await api("/api/storage-usage");
    const used = Number(data.bytes || 0);
    const available = Number(data.availableBytes || 0);
    const total = Number(data.totalBytes || 0);
    const quota =
      data.quotaBytes !== undefined && data.quotaBytes !== null
        ? Number(data.quotaBytes)
        : null;

    let warningLevel = "normal";
    let warningMsg = "";
    let percent = 0;
    let remainingText = "";

    if (quota && quota > 0) {
      const remainingQuota = Math.max(0, quota - used);
      storageUsed.textContent = `${formatSize(used)} / ${formatSize(quota)}`;
      percent = Math.min(100, Math.max(0, Math.round((used / quota) * 100)));
      if (percent >= 95) {
        warningLevel = "danger";
        warningMsg = `（配额已用 ${percent}%，极度紧张）`;
      } else if (percent >= 85) {
        warningLevel = "warning";
        warningMsg = `（配额已用 ${percent}%）`;
      }
      storageUsed.title = `已用 ${formatSize(used)} / 配额上限 ${formatSize(quota)}（已使用 ${percent}%，剩余配额 ${formatSize(remainingQuota)}）${warningMsg ? " " + warningMsg : ""}`;
      if (storageMetricLabel) {
        storageMetricLabel.textContent =
          warningLevel === "danger"
            ? "告急"
            : warningLevel === "warning"
            ? "预警"
            : "充裕";
        storageMetricLabel.title = `配额上限 ${formatSize(quota)}（剩余配额 ${formatSize(remainingQuota)}）`;
      }
      remainingText = `（余 ${formatSize(remainingQuota)}）`;
    } else if (available > 0) {
      const totalPool = used + available;
      storageUsed.textContent =
        available > 0 ? `${formatSize(used)} / ${formatSize(available)}` : formatSize(used);
      const freeGB = available / (1024 * 1024 * 1024);

      if (totalPool > 0) {
        percent = Math.min(100, Math.max(0, Math.round((used / totalPool) * 100)));
      }

      if (available > 0 && freeGB < 5) {
        warningLevel = "danger";
        const reason = `剩余不足 ${freeGB.toFixed(1)} GB`;
        warningMsg = `（磁盘空间严重不足：${reason}）`;
      } else if (available > 0 && freeGB < 10) {
        warningLevel = "warning";
        const reason = `剩余不足 ${freeGB.toFixed(1)} GB`;
        warningMsg = `（磁盘空间紧张：${reason}）`;
      }
      storageUsed.title =
        available > 0
          ? `网盘已用 ${formatSize(used)} / 磁盘剩余可用 ${formatSize(available)}（磁盘分区总容量 ${formatSize(total)}）${warningMsg ? " " + warningMsg : ""}`
          : `网盘已用 ${formatSize(used)}`;
      if (storageMetricLabel) {
        storageMetricLabel.textContent =
          warningLevel === "danger"
            ? "告急"
            : warningLevel === "warning"
            ? "紧张"
            : "充裕";
        storageMetricLabel.title = available > 0 ? `磁盘剩余可用 ${formatSize(available)}（共 ${formatSize(total)}）` : "存储状态正常";
      }
      remainingText = available > 0 ? `（余 ${formatSize(available)}）` : "";
    } else {
      storageUsed.textContent = `${formatSize(used)} / 不限`;
      percent = 0;
      warningLevel = "normal";
      storageUsed.title = `已用 ${formatSize(used)} / 配额不限`;
      if (storageMetricLabel) {
        storageMetricLabel.textContent = "充裕";
        storageMetricLabel.title = "空间不限，使用充裕";
      }
      remainingText = "（不限配额）";
    }

    const metricContainer = storageUsed.closest(".storage-usage-metric");
    if (metricContainer) {
      metricContainer.classList.remove("storage-warning", "storage-danger");
      if (warningLevel === "warning") metricContainer.classList.add("storage-warning");
      else if (warningLevel === "danger") metricContainer.classList.add("storage-danger");
    }

    const storageProgressBarFill = document.getElementById("storageProgressBarFill");
    const storagePercentBadge = document.getElementById("storagePercentBadge");
    if (storageProgressBarFill) {
      storageProgressBarFill.style.width = `${Math.max(used > 0 ? 3 : 0, percent)}%`;
      storageProgressBarFill.classList.remove("bar-warning", "bar-danger");
      if (warningLevel === "warning") storageProgressBarFill.classList.add("bar-warning");
      else if (warningLevel === "danger") storageProgressBarFill.classList.add("bar-danger");
    }
    if (storagePercentBadge) {
      if ((!quota || quota <= 0) && available <= 0) {
        storagePercentBadge.textContent = `已用 ${formatSize(used)}（不限）`;
      } else {
        const percentStr = used > 0 && percent < 1 ? "< 1%" : `${percent}%`;
        storagePercentBadge.textContent = `${percentStr} 已用${remainingText}`;
      }
      storagePercentBadge.classList.remove("badge-warning", "badge-danger");
      if (warningLevel === "warning") storagePercentBadge.classList.add("badge-warning");
      else if (warningLevel === "danger") storagePercentBadge.classList.add("badge-danger");
    }
  } catch {}
}

function scheduleStorageUsageRefresh({ force = false } = {}) {
  if (!storageUsed || driveView.classList.contains("hidden")) return;
  if (force) {
    const sinceLast = Date.now() - state.lastStorageUsageRefreshAt;
    if (sinceLast < STORAGE_USAGE_FORCE_MIN_GAP_MS) return;
    void refreshStorageUsage();
    return;
  }
  if (state.storageUsageRefreshQueued) return;
  const wait = Math.max(0, STORAGE_USAGE_SOFT_MIN_GAP_MS - (Date.now() - state.lastStorageUsageRefreshAt));
  state.storageUsageRefreshQueued = true;
  window.setTimeout(() => {
    state.storageUsageRefreshQueued = false;
    if (driveView.classList.contains("hidden")) return;
    void refreshStorageUsage();
  }, wait);
}

function suppressNextRealtimeRefresh(durationMs = 2200) {
  state.realtimeRefreshSuppressUntil = Math.max(state.realtimeRefreshSuppressUntil, Date.now() + durationMs);
  state.pendingRealtimeRefresh = false;
}

function renderHealthStatus(data) {
  if (!healthStatus) return;
  const checks = data?.checks || {};
  const failed = Object.values(checks).filter((check) => check && !check.ok);
  const warning = failed[0];
  const label = data?.ok ? "运行正常" : "需要注意";
  const detail = warning?.message || "本机服务、存储、公网和账号隔离正常";

  healthStatus.classList.remove("ok", "warn", "checking");
  healthStatus.classList.add(data?.ok ? "ok" : "warn");
  healthStatus.replaceChildren();

  const title = document.createElement("span");
  title.textContent = "服务状态";
  const strong = document.createElement("strong");
  strong.textContent = label;
  const small = document.createElement("small");
  small.textContent = detail;
  healthStatus.append(title, strong, small);
  healthStatus.title = Object.entries(checks)
    .map(([name, check]) => `${name}: ${check?.message || (check?.ok ? "正常" : "异常")}`)
    .join("\n");
}

async function refreshHealthStatus() {
  if (!healthStatus || driveView.classList.contains("hidden")) return;
  try {
    renderHealthStatus(await api("/api/health", { cache: "no-store" }));
  } catch (error) {
    healthStatus.classList.remove("ok", "checking");
    healthStatus.classList.add("warn");
    healthStatus.replaceChildren();
    const title = document.createElement("span");
    title.textContent = "服务状态";
    const strong = document.createElement("strong");
    strong.textContent = "检测失败";
    const small = document.createElement("small");
    small.textContent = friendlyErrorMessage(error, "暂时无法获取服务状态");
    healthStatus.append(title, strong, small);
  }
}

function startAccessInfoRefresh() {
  if (state.accessInfoTimer) window.clearInterval(state.accessInfoTimer);
  if (state.storageUsageTimer) window.clearInterval(state.storageUsageTimer);
  if (state.healthTimer) window.clearInterval(state.healthTimer);
  state.accessInfoTimer = window.setInterval(() => {
    refreshAccessInfo();
  }, ACCESS_INFO_REFRESH_MS);
  state.storageUsageTimer = window.setInterval(() => {
    refreshStorageUsage();
  }, STORAGE_USAGE_REFRESH_MS);
  if (healthStatus) {
    state.healthTimer = window.setInterval(() => {
      refreshHealthStatus();
    }, HEALTH_REFRESH_MS);
  }
}

function sessionToken() {
  return sessionStorage.getItem(SESSION_TOKEN_KEY) || state.token || "";
}

function setSessionToken(token) {
  state.token = token || "";
  if (token) sessionStorage.setItem(SESSION_TOKEN_KEY, token);
  else sessionStorage.removeItem(SESSION_TOKEN_KEY);
}

function restoreSessionTokenFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get("auth");
  if (!token) return;
  setSessionToken(token);
  params.delete("auth");
  const nextUrl = `${window.location.pathname}${params.toString() ? `?${params}` : ""}${window.location.hash}`;
  window.history.replaceState(window.history.state, "", nextUrl);
}

function authHeaders(base = {}) {
  const token = sessionToken();
  return token ? { ...base, Authorization: `Bearer ${token}` } : base;
}

function authUrl(url) {
  const token = sessionToken();
  if (!token) return url;
  const parsed = new URL(url, window.location.origin);
  parsed.searchParams.set("auth", token);
  return `${parsed.pathname}${parsed.search}${parsed.hash}`;
}

function friendlyErrorMessage(error, fallback = "操作失败") {
  const message = typeof error === "string" ? error : error?.message || fallback;
  const code = error?.code || "";
  if (code === "AI_KEY_MISSING") return "AI API Key 还没有配置成真实值。请配置 YUNPAN_DEEPSEEK_KEY 后重启网盘服务。";
  if (code === "AI_KEY_INVALID") return "DeepSeek API Key 无效或没有权限。请检查 Key 是否复制完整，或重新生成后重启网盘服务。";
  if (code === "AI_QUOTA_EXCEEDED") return "DeepSeek 额度或余额不足，当前无法继续调用 AI。请充值或调整账号额度后再试。";
  if (code === "AI_RATE_LIMITED") return "AI 请求太频繁，DeepSeek 暂时限流了。请稍等一会儿再发送。";
  if (code === "AI_TIMEOUT") return "AI 响应超时，可能是当前问题内容较多或网络较慢。请稍后重试，或把问题拆短一点。";
  if (code === "AI_PROVIDER_NETWORK") return "AI 连接失败，已自动重试但仍未连上。请检查网络或稍后再试。";
  if (code === "AI_PROVIDER_UNAVAILABLE") return "DeepSeek 服务暂时不可用，已自动重试但仍失败。请稍后再试。";
  if (code === "AI_OUTPUT_TRUNCATED") return "AI 联网思考内容过长，没能生成最终回答。请重新发送，或把问题拆短一点。";
  if (code === "AI_EMPTY_RESPONSE") return "AI 没有返回有效内容，请稍后重试，或换一种问法。";
  if (code === "FOLDER_LOCKED") return "这个文件位于未解锁的加密文件夹内，请先解锁文件夹后再访问。";
  if (code === "ENOSPC") return "磁盘空间不足，请释放空间后再试。";
  if (code === "EACCES" || code === "EPERM") return "没有权限访问这个文件或文件夹，请检查存储目录权限。";
  if (code === "ENOENT") return "文件或文件夹不存在，请刷新后再试。";
  if (code === "LIMIT_FILE_SIZE") return message || "单个文件超过上传限制。";
  if (code === "LIMIT_FILE_COUNT") return message || "一次上传文件数量超过限制。";
  if (/fetch failed|Failed to fetch|NetworkError|Load failed/i.test(message)) return "网络连接中断，请检查当前网络或稍后重试。";
  if (/服务器出错|server error|internal server/i.test(message)) return "服务器处理失败，请稍后重试；如果持续出现，请检查服务状态。";
  return message;
}

function isAbortError(error) {
  return error?.name === "AbortError";
}

async function api(url, options = {}) {
  const headers = options.body instanceof FormData ? {} : { "Content-Type": "application/json" };
  const response = await fetch(url, {
    ...options,
    headers: authHeaders({ ...headers, ...(options.headers || {}) }),
  });
  let rawText = "";
  let data = null;
  try {
    rawText = await response.text();
    data = rawText ? JSON.parse(rawText) : null;
  } catch {}
  if (!response.ok) {
    let fallback = (data && data.error) || "操作失败";
    if (String(url).includes("/api/ai/chat")) {
      if (response.status === 404) {
        fallback = "AI 接口还没生效，请重启网盘服务后再试。";
      } else if (!data) {
        fallback = "AI 接口返回异常，请确认网盘服务已重启并且 DeepSeek API Key 已生效。";
      } else if (response.status >= 500) {
        fallback = "AI 服务暂时处理失败，请稍后重试；如果连续失败，请检查网络、DeepSeek 状态和服务日志。";
      }
    }
    const error = new Error(friendlyErrorMessage(data || {}, fallback));
    error.status = response.status;
    if (data && typeof data === "object") Object.assign(error, data);
    error.message = friendlyErrorMessage(error);
    throw error;
  }
  return data;
}

function apiUpload(url, form, files) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.withCredentials = true;
    const token = sessionToken();
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);

    xhr.upload.addEventListener("progress", (event) => {
      if (!event.lengthComputable) return;
      const percent = Math.round((event.loaded / event.total) * 100);
      showUploadProgress(percent, files.length);
    });

    xhr.addEventListener("load", () => {
      let data = {};
      try {
        data = JSON.parse(xhr.responseText || "{}");
      } catch {}
      if (xhr.status >= 200 && xhr.status < 300) resolve(data);
      else reject(new Error(friendlyErrorMessage(data || {}, data.error || "上传失败")));
    });

    xhr.addEventListener("error", () => reject(new Error("网络连接中断，上传失败，请检查当前网络后重试。")));
    xhr.send(form);
  });
}

function uploadChunkRequest(url, form, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.withCredentials = true;
    const token = sessionToken();
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) onProgress(event.loaded, event.total);
    });
    xhr.addEventListener("load", () => {
      let data = {};
      try {
        data = JSON.parse(xhr.responseText || "{}");
      } catch {}
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(data);
      } else {
        const error = new Error(friendlyErrorMessage(data || {}, data.error || "上传分片失败"));
        error.status = xhr.status;
        reject(error);
      }
    });
    xhr.addEventListener("error", () => {
      const error = new Error("网络连接短暂中断，即将自动重连并续传...");
      error.isNetworkError = true;
      reject(error);
    });
    xhr.addEventListener("timeout", () => {
      const error = new Error("分片上传网络响应超时，即将自动重试...");
      error.isTimeout = true;
      reject(error);
    });
    xhr.timeout = 75000;
    xhr.send(form);
  });
}

function openFilePicker(input) {
  input.value = "";
  if (typeof input.showPicker === "function") input.showPicker();
  else input.click();
}

function handleFileInputChange(input) {
  window.setTimeout(() => {
    const files = [...input.files];
    if (!files.length) return;
    setStatus(`已选择 ${files.length} 个文件，准备上传...`);
    uploadFiles(files, state.uploadTargetPath);
  }, 0);
}

function shouldUseChunkUpload(files) {
  if (window.location.protocol === "https:" || PUBLIC_CHUNK_HOSTS.has(window.location.hostname)) return true;
  if (files.length > LAN_DIRECT_UPLOAD_FILE_LIMIT) return true;
  return files.some((file) => file.size > LAN_DIRECT_UPLOAD_LIMIT);
}

function isSystemUploadPath(path = "") {
  return String(path)
    .replaceAll("\\", "/")
    .split("/")
    .filter(Boolean)
    .some((part) => {
      const lower = part.toLowerCase();
      return (
        part === ".tmp" ||
        part === ".preview" ||
        part.startsWith("~$") ||
        lower === "thumbs.db" ||
        lower === "desktop.ini" ||
        lower === ".ds_store" ||
        lower.endsWith(".tmp") ||
        lower.endsWith(".temp")
      );
    });
}

function filterUploadFiles(files) {
  const kept = [];
  let skipped = 0;
  for (const file of files) {
    if (isSystemUploadPath(fileRelativePath(file))) {
      skipped += 1;
      continue;
    }
    kept.push(file);
  }
  return { files: kept, skipped };
}

function isMobileUploadClient() {
  const coarsePointer = window.matchMedia?.("(pointer: coarse)")?.matches;
  return Boolean(coarsePointer || /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent));
}

function chunkUploadConcurrency() {
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (connection?.saveData) return 1;
  if (["slow-2g", "2g"].includes(connection?.effectiveType)) return 1;
  if (connection?.effectiveType === "3g") return 2;
  return isMobileUploadClient() ? PUBLIC_UPLOAD_CONCURRENCY_MOBILE : PUBLIC_UPLOAD_CONCURRENCY_DESKTOP;
}

function totalUploadBytes(files) {
  return files.reduce((sum, file) => sum + file.size, 0);
}

function getCachedFolder(path) {
  const cached = state.folderCache.get(path);
  if (!cached) return null;
  if (Date.now() - cached.at > FOLDER_CACHE_TTL_MS) {
    state.folderCache.delete(path);
    return null;
  }
  return cached.data;
}

function setCachedFolder(data) {
  state.folderCache.set(data.path, {
    data: {
      ...data,
      items: Array.isArray(data.items) ? data.items.map((item) => ({ ...item })) : [],
    },
    at: Date.now(),
  });
  while (state.folderCache.size > FOLDER_CACHE_MAX) {
    const oldestKey = state.folderCache.keys().next().value;
    state.folderCache.delete(oldestKey);
  }
}

function clearFolderCaches(path) {
  if (typeof path === "string") state.folderCache.delete(path);
  else state.folderCache.clear();
  state.folderListCache = null;
  state.folderListCacheAt = 0;
}

function isModalOpen(modal) {
  return modal && !modal.classList.contains("hidden");
}

function isUiInteractionActive() {
  return (
    state.busy ||
    isAiGenerating ||
    state.selectionMode ||
    isModalOpen(uploadModal) ||
    isModalOpen(bulkMoveModal) ||
    isModalOpen(previewModal) ||
    isModalOpen(folderPasswordModal) ||
    isModalOpen(dialogModal) ||
    !uploadProgress.classList.contains("hidden")
  );
}

async function flushPendingRealtimeRefresh() {
  if (!state.pendingRealtimeRefresh || isUiInteractionActive() || driveView.classList.contains("hidden")) return;
  state.pendingRealtimeRefresh = false;
  await refreshCurrentFolder();
}

async function getFolderList(options = {}) {
  const fresh = state.folderListCache && Date.now() - state.folderListCacheAt < FOLDER_LIST_CACHE_TTL_MS;
  if (!options.forceRefresh && fresh) return state.folderListCache;
  const data = await api("/api/folders");
  state.folderListCache = data;
  state.folderListCacheAt = Date.now();
  return data;
}

function folderOptionLabel(folder) {
  return folder.path ? folder.displayName || folder.name : "全部文件（根目录）";
}

function folderIsInside(folderPath, parentPath) {
  return Boolean(parentPath) && (folderPath === parentPath || folderPath.startsWith(`${parentPath}/`));
}

function folderSelectOptions(folders, options = {}) {
  const excluded = new Set(options.excludePaths || []);
  return folders
    .filter((folder) => !excluded.has(folder.path))
    .filter((folder) => !options.excludeInside || !folderIsInside(folder.path, options.excludeInside))
    .map((folder) => ({
      value: folder.path,
      label: folderOptionLabel(folder),
    }));
}

function updateSearchScopeLabel() {
  if (!searchScopeLabel) return;
  const folder = displayFolder(state.path || "");
  const label = `当前搜索目录：${folder}`;
  const prefix = document.createElement("span");
  prefix.textContent = "当前搜索目录：";
  const path = document.createElement("strong");
  path.className = "search-scope-path";
  path.textContent = folder;
  searchScopeLabel.replaceChildren(prefix, path);
  searchScopeLabel.title = label;
}

function folderSelectedLabel(select) {
  return select.selectedOptions[0]?.textContent || select.options[0]?.textContent || "请选择目标文件夹";
}

function closeFolderDropdown(select) {
  const dropdown = folderDropdowns.get(select);
  if (!dropdown) return false;
  const wasOpen = !dropdown.menu.classList.contains("hidden");
  dropdown.menu.classList.add("hidden");
  dropdown.button.setAttribute("aria-expanded", "false");
  return wasOpen;
}

function closeAllFolderDropdowns(exceptSelect = null) {
  let closed = false;
  for (const select of folderDropdowns.keys()) {
    if (select === exceptSelect) continue;
    closed = closeFolderDropdown(select) || closed;
  }
  return closed;
}

function ensureFolderDropdown(select) {
  if (folderDropdowns.has(select)) return folderDropdowns.get(select);

  const wrapper = document.createElement("div");
  wrapper.className = "folder-combobox";

  const button = document.createElement("button");
  button.type = "button";
  button.className = "folder-combobox-button";
  button.setAttribute("aria-haspopup", "listbox");
  button.setAttribute("aria-expanded", "false");

  const label = document.createElement("span");
  label.className = "folder-combobox-label";
  button.append(label);

  const arrow = document.createElement("span");
  arrow.className = "folder-combobox-arrow";
  arrow.setAttribute("aria-hidden", "true");
  button.append(arrow);

  const menu = document.createElement("div");
  menu.className = "folder-combobox-menu hidden";
  menu.setAttribute("role", "listbox");

  wrapper.append(button, menu);
  select.classList.add("folder-target-native");
  select.after(wrapper);

  button.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    const willOpen = menu.classList.contains("hidden");
    closeAllFolderDropdowns(select);
    menu.classList.toggle("hidden", !willOpen);
    button.setAttribute("aria-expanded", willOpen ? "true" : "false");
    if (willOpen) {
      const active = menu.querySelector(".selected");
      active?.scrollIntoView({ block: "nearest" });
    }
  });

  const dropdown = { wrapper, button, label, menu };
  folderDropdowns.set(select, dropdown);
  return dropdown;
}

function syncFolderDropdown(select) {
  const dropdown = ensureFolderDropdown(select);
  dropdown.label.textContent = folderSelectedLabel(select);
  dropdown.menu.replaceChildren();

  for (const option of select.options) {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "folder-combobox-option";
    item.textContent = option.textContent;
    item.dataset.value = option.value;
    item.disabled = option.disabled;
    item.setAttribute("role", "option");
    item.setAttribute("aria-selected", option.selected ? "true" : "false");
    item.classList.toggle("selected", option.selected);
    item.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      select.value = option.value;
      select.dispatchEvent(new Event("change", { bubbles: true }));
      syncFolderDropdown(select);
      closeFolderDropdown(select);
      dropdown.button.focus();
    });
    dropdown.menu.append(item);
  }
}

function delay(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

async function uploadChunkWithRetry(url, form, onProgress, chunkInfo = {}) {
  let lastError = null;
  const maxAttempts = 5;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await uploadChunkRequest(url, form, onProgress);
    } catch (error) {
      if (isAbortError(error)) return;
      lastError = error;
      // 遇到配额已满、未授权或非法参数等不可重试错误，立即终止重试并抛出
      if (error.status === 403 || error.status === 401 || error.status === 400 || error.quotaExceeded) {
        throw error;
      }
      if (attempt < maxAttempts) {
        // 指数退避：1s, 2s, 4s, 8s 并添加微小随机抖动，总重试容忍窗口达 15~20 秒
        const backoffMs = Math.min(1000 * Math.pow(2, attempt - 1) + Math.random() * 500, 10000);
        const waitSec = Math.max(1, Math.round(backoffMs / 1000));
        const label = chunkInfo.partLabel ? ` ${chunkInfo.partLabel}` : "";
        setStatus(`网络出现短暂波动，${waitSec} 秒后自动重试并续传${label}（第 ${attempt}/${maxAttempts - 1} 次重连）...`);
        await delay(backoffMs);
      }
    }
  }
  throw lastError;
}

function chunkUploadPlans(fileSize) {
  const defaultConcurrency = chunkUploadConcurrency();
  const plans = [
    {
      label: "default",
      chunkSize: null,
      concurrency: Math.max(defaultConcurrency, 1),
    },
  ];
  plans.push({
    label: "smaller-chunks",
    chunkSize: FALLBACK_CHUNK_BYTES,
    concurrency: Math.max(defaultConcurrency, 1),
  });
  if (defaultConcurrency > 1) {
    plans.push({
      label: "last-resort",
      chunkSize: FALLBACK_CHUNK_BYTES,
      concurrency: 1,
    });
  }
  return plans;
}

async function calculateSha256(file) {
  if (!window.crypto?.subtle) return null;
  if (file.size > 80 * 1024 * 1024) return null; // Avoid high memory usage on very large files
  try {
    const buffer = await file.arrayBuffer();
    const digest = await crypto.subtle.digest("SHA-256", buffer);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  } catch {
    return null;
  }
}

async function uploadFilesInChunks(files, targetPath, conflictDecisions = {}) {
  const totalBytes = Math.max(totalUploadBytes(files), 1);
  let completedBytes = 0;
  for (const file of files) {
    await delay(0);
    const relativePath = fileRelativePath(file);
    const fileCompletedBytes = completedBytes;
    const conflictAction = conflictDecisions[relativePath] || conflictDecisions[file.name] || "keep_both";
    let lastError = null;

    // Instant upload check (云端秒传与哈希比对)
    const hash = await calculateSha256(file);
    if (hash) {
      try {
        const checkRes = await api("/api/upload-check-hash", {
          method: "POST",
          body: JSON.stringify({
            path: targetPath,
            targetPath,
            name: file.name,
            relativePath,
            hash,
            size: file.size,
            conflictAction,
          }),
        });
        if (checkRes && checkRes.instant) {
          completedBytes = fileCompletedBytes + file.size;
          showUploadProgress(
            Math.min(99, Math.round((completedBytes / totalBytes) * 100)),
            files.length
          );
          setStatus(`“${file.name}” 云端秒传成功！`);
          continue;
        }
      } catch (err) {
        if (err && (err.status === 403 || err.quotaExceeded || String(err.message || "").includes("配额不足"))) {
          throw err;
        }
        // Fall back seamlessly to regular chunk upload
      }
    }
    const runPlan = async (plan) => {
      let uploadId = "";
      let stageCompletedBytes = 0;
      try {
        const init = await api("/api/upload-chunk/init", {
          method: "POST",
          body: JSON.stringify({
            path: targetPath,
            name: file.name,
            relativePath,
            size: file.size,
            conflictAction,
          }),
        });
        uploadId = init.uploadId;
        const chunkSize = plan.chunkSize || init.chunkSize || FALLBACK_CHUNK_BYTES;
        const chunkCount = Math.max(Math.ceil(file.size / chunkSize), 1);
        const inFlightBytes = new Map();
        const uploadChunkAtIndex = async (index) => {
          const start = index * chunkSize;
          const end = Math.min(start + chunkSize, file.size);
          const chunk = file.slice(start, end);
          const form = new FormData();
          form.append("chunk", chunk, `${file.name}.part${index}`);
          await uploadChunkWithRetry(
            `/api/upload-chunk/${encodeURIComponent(uploadId)}/${index}`,
            form,
            (loaded) => {
              inFlightBytes.set(index, Math.min(loaded, chunk.size));
              const activeBytes = [...inFlightBytes.values()].reduce((sum, value) => sum + value, 0);
              const percent = Math.min(
                99,
                Math.round(((fileCompletedBytes + stageCompletedBytes + activeBytes) / totalBytes) * 100)
              );
              showUploadProgress(percent, files.length);
            },
            { partLabel: `分片 ${index + 1}/${chunkCount}` }
          );
          inFlightBytes.delete(index);
          stageCompletedBytes += chunk.size;
          showUploadProgress(
            Math.min(99, Math.round(((fileCompletedBytes + stageCompletedBytes) / totalBytes) * 100)),
            files.length
          );
        };
        let nextIndex = 0;
        async function worker() {
          while (nextIndex < chunkCount) {
            const currentIndex = nextIndex;
            nextIndex += 1;
            await uploadChunkAtIndex(currentIndex);
          }
        }
        await Promise.all(Array.from({ length: Math.max(plan.concurrency, 1) }, () => worker()));
        await api(`/api/upload-chunk/${encodeURIComponent(uploadId)}/finish`, {
          method: "POST",
          body: JSON.stringify({ chunkCount }),
        });
        completedBytes = fileCompletedBytes + file.size;
        return true;
      } catch (error) {
        lastError = error;
        if (uploadId) {
          await api(`/api/upload-chunk/${encodeURIComponent(uploadId)}`, { method: "DELETE" }).catch(() => {});
        }
        return false;
      }
    };

    const plans = chunkUploadPlans(file.size);
    let uploaded = false;
    for (let planIndex = 0; planIndex < plans.length; planIndex += 1) {
      if (await runPlan(plans[planIndex])) {
        uploaded = true;
        break;
      }
      console.warn(`Chunk upload plan failed (${plans[planIndex].label})`, lastError);
      if (lastError?.status === 403 || lastError?.message?.includes("配额不足")) {
        break;
      }
    }
    if (!uploaded) {
      throw lastError || new Error("Upload failed.");
    }
  }
}

function showUploadProgress(percent, count) {
  state.uploadProgressMax = Math.max(state.uploadProgressMax || 0, percent);
  uploadProgress.classList.remove("hidden");
  uploadProgressText.textContent = `正在上传 ${count} 个文件`;
  uploadProgressPercent.textContent = `${state.uploadProgressMax}%`;
  uploadProgressBar.style.width = `${state.uploadProgressMax}%`;
}

function hideUploadProgressSoon() {
  state.uploadProgressMax = 100;
  uploadProgressText.textContent = "上传完成";
  uploadProgressPercent.textContent = "100%";
  uploadProgressBar.style.width = "100%";
  window.setTimeout(() => {
    uploadProgress.classList.add("hidden");
    uploadProgressBar.style.width = "0%";
    state.uploadProgressMax = 0;
  }, 650);
}

function formatSize(size, precision = null) {
  if (size == null) return "-";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let value = Number(size);
  let index = 0;
  while (value >= 1024 && index < units.length - 1) {
    value /= 1024;
    index += 1;
  }
  if (precision !== null) {
    return `${value.toFixed(precision)} ${units[index]}`;
  }
  if (index >= 3) {
    return `${value.toFixed(1)} ${units[index]}`;
  }
  return `${value.toFixed(value >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
}

function compactStoragePath(value) {
  const text = String(value || "");
  if (text.length <= 34) return text;
  const parts = text.split(/[\\/]+/).filter(Boolean);
  if (parts.length <= 2) return text;
  const drive = /^[a-zA-Z]:/.test(parts[0]) ? parts[0] : "";
  const prefix = drive || (text.startsWith("\\\\") ? `\\\\${parts.slice(0, 2).join("\\")}` : "");
  const tail = parts.slice(-2).join("\\");
  return prefix ? `${prefix}\\...\\${tail}` : `...\\${tail}`;
}

function formatTime(value) {
  return new Date(value).toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function parentPath(path) {
  if (!path) return "";
  const parts = path.split("/");
  parts.pop();
  return parts.join("/");
}

function joinPath(base, name) {
  return base ? `${base}/${name}` : name;
}

function displayFolder(path) {
  if (!path) return "全部文件";
  const parts = path.split("/").filter(Boolean);
  return parts[parts.length - 1] || "全部文件";
}

function fileExt(name) {
  const dot = name.lastIndexOf(".");
  return dot === -1 ? "" : name.slice(dot + 1).toLowerCase();
}

const AI_SUMMARIZE_EXTENSIONS = new Set([
  "txt", "md", "json", "js", "ts", "html", "css", "py", "csv", "tsv", "log", "xml", "sql", "sh", "bat",
  "pdf", "doc", "docx", "ppt", "pptx", "xlsx", "xls",
  "jpg", "jpeg", "png", "webp", "bmp", "tif", "tiff"
]);

function canSummarizeFile(name) {
  if (!name) return false;
  return AI_SUMMARIZE_EXTENSIONS.has(fileExt(name));
}

function itemName(item) {
  return item.displayName || item.name;
}

function lockLabel(item) {
  return item.locked ? "加密" : "文件夹";
}

function isFolderUnlocked(path) {
  return state.unlockedFolders.has(path) || state.items.some((item) => item.path === path && item.locked && item.unlocked);
}

async function unlockFolder(path, folderName = displayFolder(path)) {
  if (!path) return true;
  if (isFolderUnlocked(path)) return true;
  const result = await openFolderPasswordDialog({
    mode: "unlock",
    folderPath: path,
    folderName,
    async submit(password) {
      await api("/api/folder-unlock", {
        method: "POST",
        body: JSON.stringify({ path, password }),
      });
      markFolderUnlockedEverywhere(path);
      return true;
    },
  });
  return result !== null;
}

async function ensureFolderReady(path, folderName = displayFolder(path)) {
  if (!path) return true;
  if (!state.items.some((item) => item.path === path && item.type === "folder" && item.locked)) return true;
  return unlockFolder(path, folderName);
}

async function openFolderPasswordSettings(item) {
  const info = await api(`/api/folder-password?path=${encodeURIComponent(item.path)}`);
  await openFolderPasswordDialog({
    mode: info.locked ? "edit" : "create",
    folderPath: item.path,
    folderName: itemName(item),
    locked: info.locked,
    successMessage(payload) {
      if (payload?.remove) return "删除密码成功";
      if (payload?.resetWithAdmin) return "重置密码成功";
      return info.locked ? "修改密码成功" : "设置密码成功";
    },
    async submit(payload) {
      await api("/api/folder-password", {
        method: "POST",
        body: JSON.stringify({
          path: item.path,
          password: payload.password,
          remove: Boolean(payload.remove),
          currentPassword: payload.currentPassword || "",
          adminPassword: payload.adminPassword,
          resetWithAdmin: Boolean(payload.resetWithAdmin),
        }),
      });
      markFolderLockChangedEverywhere(item.path, Boolean(payload.password?.trim()));
      return payload;
    },
  });
}

async function verifyFolderDeletion(item) {
  if (!(item.type === "folder" && item.locked)) return null;
  return openFolderPasswordDialog({
    mode: "delete",
    folderPath: item.path,
    folderName: itemName(item),
    locked: true,
    async submit(payload) {
      await api("/api/item", {
        method: "DELETE",
        body: JSON.stringify({
          path: item.path,
          adminPassword: payload.adminPassword,
          currentPassword: payload.currentPassword,
          verifyOnly: true,
        }),
      });
      return payload;
    },
  });
}

async function askForFolderName() {
  const result = await openDialog({
    eyebrow: "新建文件夹",
    title: "输入文件夹名称",
    description: "先输入文件夹名称，下一步可选择是否设置密码。",
    input: { label: "文件夹名称", value: "", placeholder: "请输入文件夹名称" },
    validate(value) {
      if (!value.trim()) return "请输入文件夹名称";
      return "";
    },
  });
  return result?.value?.trim() || "";
}

async function showErrorDialog(message) {
  const result = await openDialog({
    eyebrow: "提示",
    title: "操作失败",
    description: message || "操作失败",
    validate() {
      return "";
    },
  });
  return result;
}

async function showSuccessDialog(message, title = "操作成功") {
  const result = await openDialog({
    eyebrow: "提示",
    title,
    description: message || title,
    validate() {
      return "";
    },
  });
  return result;
}

async function showConfirmDialog(title, description) {
  const result = await openDialog({
    eyebrow: "确认",
    title,
    description,
    validate() {
      return "";
    },
  });
  return result !== null;
}

async function showSuccessAlert(title, description, confirmText = "前往重新登录") {
  const result = await openDialog({
    eyebrow: "安全提示",
    title,
    description,
    confirmText,
    hideCancel: true,
    validate() {
      return "";
    },
  });
  return result !== null;
}

function fillFolderPasswordDialog(config) {
  state.folderPasswordDialog = config;
  folderPasswordError.textContent = "";
  folderAdminPasswordInput.value = "";
  folderCurrentPasswordInput.value = "";
  folderNewPasswordInput.value = "";

  const isUnlock = config.mode === "unlock";
  const isDownload = config.mode === "download";
  const isEdit = config.mode === "edit";
  const isCreate = config.mode === "create";
  const isDelete = config.mode === "delete";
  const isReset = config.mode === "reset";

  folderPasswordEyebrow.textContent = isUnlock
    ? "文件夹访问"
    : isDownload
      ? "下载验证"
    : isDelete
      ? "删除验证"
    : isReset
      ? "找回密码"
      : "文件夹加密";
  folderPasswordTitle.textContent = isUnlock
    ? "输入文件夹密码"
    : isDownload
      ? "验证文件夹密码"
    : isDelete
      ? "删除加密文件夹"
    : isReset
      ? "重置文件夹密码"
    : isEdit
      ? "修改文件夹密码"
      : "设置文件夹密码";
  folderPasswordDescription.textContent = isUnlock
    ? `请输入“${config.folderName}”的文件夹密码后进入。`
    : isDownload
      ? `下载“${config.folderName}”中的内容前，请再次输入文件夹密码。`
    : isDelete
      ? `删除“${config.folderName}”前，请验证网盘登录密码和当前文件夹密码。`
    : isReset
      ? `文件夹原密码不能查看。你可以验证网盘登录密码后，重新设置或清除“${config.folderName}”的文件夹密码。`
    : isEdit
      ? `请验证网盘登录密码和当前文件夹密码，再修改“${config.folderName}”的密码。`
      : `你可以为“${config.folderName}”设置密码；如果留空，则创建普通文件夹。`;

  folderAdminPasswordField.classList.toggle("hidden", isUnlock || isDownload);
  folderAdminPasswordLabel.textContent = "网盘登录密码";
  folderCurrentPasswordField.classList.toggle("hidden", !(isEdit || isUnlock || isDownload || isDelete));
  folderCurrentPasswordLabel.textContent = isUnlock || isDownload ? "文件夹密码" : "当前文件夹密码";
  folderNewPasswordField.classList.toggle("hidden", isUnlock || isDownload || isDelete);
  confirmFolderPasswordBtn.classList.toggle("hidden", isDelete);
  folderNewPasswordLabel.textContent = "新的文件夹密码";
  resetFolderPasswordBtn.classList.toggle("hidden", !(isUnlock || isDownload || isEdit || isDelete));
  resetFolderPasswordBtn.textContent = "忘记密码";
  removeFolderPasswordBtn.classList.toggle("hidden", !(isEdit || isDelete || isReset));
  removeFolderPasswordBtn.textContent = isDelete ? "确认删除" : isReset ? "清除文件夹密码" : "取消密码";
  folderPasswordHint.textContent = isUnlock
    ? "进入文件夹时只需要输入这个文件夹自己的密码；如果忘记，可以点“忘记密码”后用网盘登录密码重置。"
    : isDownload
      ? "为了保护加密文件夹，下载时需要再次验证这个文件夹自己的密码。"
    : isDelete
      ? "删除加密文件夹前，必须正确输入网盘登录密码和当前文件夹密码；如果忘记文件夹密码，请先点“忘记密码”重置或清除。"
    : isReset
      ? "这里不会找回原密码，只会用网盘登录密码重新设置一个新密码；点击“清除文件夹密码”可改回普通文件夹。"
    : isEdit
      ? "修改或取消密码时，必须正确输入网盘登录密码和当前文件夹密码；如果忘记文件夹密码，可以点“忘记密码”。"
      : "如果设置文件夹密码，需要验证网盘登录密码；如果留空，则不设置文件夹密码。";

  folderPasswordModal.classList.remove("hidden");
  folderPasswordModal.setAttribute("aria-hidden", "false");
  window.setTimeout(() => {
    if (isUnlock || isDownload) folderCurrentPasswordInput.focus();
    else folderAdminPasswordInput.focus();
  }, 0);
}

function closeFolderPasswordModal() {
  folderPasswordModal.classList.add("hidden");
  folderPasswordModal.setAttribute("aria-hidden", "true");
  folderPasswordError.textContent = "";
  state.folderPasswordDialog = null;
  void flushPendingRealtimeRefresh();
}

function closeDialogModal() {
  closeFolderDropdown(dialogSelect);
  confirmDialogBtn.classList.remove("danger");
  confirmDialogBtn.textContent = "确定";
  cancelDialogBtn?.classList.remove("hidden");
  closeDialogModalBtn?.classList.remove("hidden");
  dialogModal.classList.add("hidden");
  dialogModal.setAttribute("aria-hidden", "true");
  dialogError.textContent = "";
  state.dialog = null;
  void flushPendingRealtimeRefresh();
}

function openDialog(config) {
  dialogEyebrow.textContent = config.eyebrow || "操作";
  dialogTitle.textContent = config.title || "确认";
  dialogDescription.textContent = config.description || "";
  confirmDialogBtn.textContent = config.confirmText || "确定";
  if (config.danger) {
    confirmDialogBtn.classList.add("danger");
  } else {
    confirmDialogBtn.classList.remove("danger");
  }
  dialogError.textContent = "";
  if (config.hideCancel) {
    cancelDialogBtn?.classList.add("hidden");
    closeDialogModalBtn?.classList.add("hidden");
  } else {
    cancelDialogBtn?.classList.remove("hidden");
    closeDialogModalBtn?.classList.remove("hidden");
  }

  dialogInputField.classList.toggle("hidden", !config.input);
  if (config.input) {
    dialogInputLabel.textContent = config.input.label;
    dialogInput.type = config.input.type || "text";
    dialogInput.value = config.input.value || "";
    dialogInput.placeholder = config.input.placeholder || "";
  } else {
    dialogInput.value = "";
  }

  dialogSelectField.classList.toggle("hidden", !config.select);
  dialogSelect.replaceChildren();
  if (config.select) {
    dialogSelectLabel.textContent = config.select.label;
    for (const optionConfig of config.select.options || []) {
      const option = document.createElement("option");
      option.value = optionConfig.value;
      option.textContent = optionConfig.label;
      if (optionConfig.disabled) option.disabled = true;
      dialogSelect.append(option);
    }
    dialogSelect.value = [...dialogSelect.options].some((option) => option.value === config.select.value)
      ? config.select.value
      : dialogSelect.options[0]?.value || "";
    syncFolderDropdown(dialogSelect);
  } else {
    dialogSelect.value = "";
    closeFolderDropdown(dialogSelect);
    syncFolderDropdown(dialogSelect);
  }

  dialogSecondInputField.classList.toggle("hidden", !config.secondInput);
  if (config.secondInput) {
    dialogSecondInputLabel.textContent = config.secondInput.label;
    dialogSecondInput.type = config.secondInput.type || "text";
    dialogSecondInput.value = config.secondInput.value || "";
    dialogSecondInput.placeholder = config.secondInput.placeholder || "";
  } else {
    dialogSecondInput.value = "";
  }

  state.dialog = config;
  dialogModal.classList.remove("hidden");
  dialogModal.setAttribute("aria-hidden", "false");
  window.setTimeout(() => {
    if (config.input) dialogInput.focus();
    else if (config.select) folderDropdowns.get(dialogSelect)?.button.focus();
  }, 0);
  return new Promise((resolve) => {
    state.dialog.resolve = resolve;
  });
}

function submitDialogModal() {
  const config = state.dialog;
  if (!config?.resolve) return;
  dialogError.textContent = "";
  const first = dialogInput.value;
  const selected = dialogSelect.value;
  const second = dialogSecondInput.value;

  if (typeof config.validate === "function") {
    const message = config.validate(first, second, selected);
    if (message) {
      dialogError.textContent = message;
      return;
    }
  }

  const resolve = config.resolve;
  closeDialogModal();
  resolve({ value: first, secondValue: second, selectedValue: selected });
}

function openFolderPasswordDialog(config) {
  fillFolderPasswordDialog(config);
  return new Promise((resolve) => {
    state.folderPasswordDialog.resolve = resolve;
  });
}

function switchToFolderPasswordReset() {
  const current = state.folderPasswordDialog;
  if (!current?.resolve) return;
  const resolve = current.resolve;
  const resetConfig = {
    ...current,
    mode: "reset",
    successMessage(payload) {
      return payload?.remove ? "清除文件夹密码成功" : "重置密码成功";
    },
    async submit(payload) {
      await api("/api/folder-password", {
        method: "POST",
        body: JSON.stringify({
          path: current.folderPath,
          password: payload.password,
          remove: Boolean(payload.remove),
          adminPassword: payload.adminPassword,
          resetWithAdmin: true,
        }),
      });
      markFolderLockChangedEverywhere(current.folderPath, Boolean(payload.password?.trim()));
      return payload;
    },
  };
  fillFolderPasswordDialog(resetConfig);
  state.folderPasswordDialog.resolve = resolve;
}

async function submitFolderPasswordDialog(remove = false) {
  const config = state.folderPasswordDialog;
  if (!config?.resolve) return;
  folderPasswordError.textContent = "";
  const successMessage =
    typeof config.successMessage === "function"
      ? config.successMessage({ remove })
      : config.successMessage;

  if (config.mode === "unlock" || config.mode === "download") {
    const password = folderCurrentPasswordInput.value;
    if (!password.trim()) {
      folderPasswordError.textContent = "请输入文件夹密码";
      return;
    }
    try {
      const result = config.submit ? await config.submit(password) : password;
      const resolve = config.resolve;
      closeFolderPasswordModal();
      resolve(result);
    } catch (error) {
      folderPasswordError.textContent = error.message || "文件夹密码错误";
    }
    return;
  }

  const adminPassword = folderAdminPasswordInput.value;
  const nextPasswordValue = folderNewPasswordInput.value;

  if (config.mode === "create" && !nextPasswordValue.trim()) {
    try {
      const payload = { remove: false, password: "", currentPassword: "", adminPassword: "" };
      const result = config.submit ? await config.submit(payload) : payload;
      const resolve = config.resolve;
      closeFolderPasswordModal();
      if (successMessage) await showSuccessDialog(successMessage);
      resolve(result);
    } catch (error) {
      folderPasswordError.textContent = error.message || "操作失败";
    }
    return;
  }

  if (!adminPassword.trim()) {
    folderPasswordError.textContent = "请输入网盘登录密码";
    return;
  }

  if (config.mode === "reset") {
    if (!remove && !nextPasswordValue.trim()) {
      folderPasswordError.textContent = "请输入新的文件夹密码，或点击“清除文件夹密码”";
      return;
    }
    if (remove) {
      const ok = await showConfirmDialog("清除文件夹密码", "确认清除这个文件夹的密码吗？清除后可直接进入。");
      if (!ok) return;
    }
    try {
      const payload = {
        remove,
        password: remove ? "" : nextPasswordValue,
        currentPassword: "",
        adminPassword,
        resetWithAdmin: true,
      };
      const result = config.submit ? await config.submit(payload) : payload;
      const resolve = config.resolve;
      closeFolderPasswordModal();
      if (successMessage) await showSuccessDialog(successMessage);
      resolve(result);
    } catch (error) {
      folderPasswordError.textContent = error.message || "操作失败";
    }
    return;
  }

  if (config.mode === "edit" || config.mode === "delete") {
    const currentPassword = folderCurrentPasswordInput.value;
    if (!currentPassword.trim()) {
      folderPasswordError.textContent = "请输入当前文件夹密码";
      return;
    }
    if (remove) {
      if (config.mode === "edit") {
        const ok = await showConfirmDialog("取消文件夹密码", "确认取消这个文件夹的密码吗？取消后可直接进入。");
        if (!ok) return;
      }
      try {
        const payload = {
          remove: config.mode === "edit",
          password: "",
          currentPassword,
          adminPassword,
        };
        const result = config.submit ? await config.submit(payload) : payload;
        const resolve = config.resolve;
        closeFolderPasswordModal();
        if (successMessage) await showSuccessDialog(successMessage);
        resolve(result);
      } catch (error) {
        folderPasswordError.textContent = error.message || "操作失败";
      }
      return;
    }
    const password = nextPasswordValue;
    if (!password.trim()) {
      folderPasswordError.textContent = "请输入新的文件夹密码";
      return;
    }
    try {
      const payload = { remove: false, password, currentPassword, adminPassword };
      const result = config.submit ? await config.submit(payload) : payload;
      const resolve = config.resolve;
      closeFolderPasswordModal();
      if (successMessage) await showSuccessDialog(successMessage);
      resolve(result);
    } catch (error) {
      folderPasswordError.textContent = error.message || "操作失败";
    }
    return;
  }

  if (remove) {
    const currentPassword = folderCurrentPasswordInput.value;
    try {
      const payload = { remove: true, password: "", currentPassword, adminPassword };
      const result = config.submit ? await config.submit(payload) : payload;
      const resolve = config.resolve;
      closeFolderPasswordModal();
      resolve(result);
    } catch (error) {
      folderPasswordError.textContent = error.message || "操作失败";
    }
    return;
  }

  const password = nextPasswordValue;
  if (!password.trim()) {
    folderPasswordError.textContent = "请输入文件夹密码";
    return;
  }
  try {
    const payload = {
      remove: false,
      password,
      currentPassword: folderCurrentPasswordInput.value,
      adminPassword,
    };
    const result = config.submit ? await config.submit(payload) : payload;
    const resolve = config.resolve;
    closeFolderPasswordModal();
    if (successMessage) await showSuccessDialog(successMessage);
    resolve(result);
  } catch (error) {
    folderPasswordError.textContent = error.message || "操作失败";
  }
}

function isExternalFileDrag(event) {
  const types = event?.dataTransfer?.types;
  if (!types) return false;
  return Array.from(types).includes("Files") && !state.draggedItemPath;
}

function previewKind(name) {
  const ext = fileExt(name);
  if (["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg"].includes(ext)) return "image";
  if (["mp4", "webm", "mov"].includes(ext)) return "video";
  if (["mp3", "wav", "ogg", "flac"].includes(ext)) return "audio";
  if (ext === "pdf") return "pdf";
  if (["xlsx", "xls", "csv"].includes(ext)) return "spreadsheet";
  if (["doc", "docx", "ppt", "pptx"].includes(ext)) return "office";
  if (["txt", "md", "json", "js", "css", "html", "xml", "log"].includes(ext)) return "text";
  return "unsupported";
}

function currentFolderImages() {
  return state.items.filter((item) => item.type === "file" && previewKind(item.name) === "image");
}

function previewImageNeighbor(item, direction) {
  const images = currentFolderImages();
  if (images.length < 2) return null;
  const index = images.findIndex((image) => image.path === item.path);
  if (index < 0) return null;
  return images[(index + direction + images.length) % images.length];
}

function switchImagePreview(direction) {
  if (!state.previewItem || previewKind(state.previewItem.name) !== "image") return;
  const nextItem = previewImageNeighbor(state.previewItem, direction);
  if (nextItem) openPreview(nextItem);
}

function clearImagePreviewControls() {
  previewCard.querySelectorAll(".preview-nav, .preview-counter").forEach((element) => element.remove());
}

function updateLocation(path, replace = false) {
  const url = path ? `/?path=${encodeURIComponent(path)}` : "/";
  if (replace) window.history.replaceState({ path }, "", url);
  else window.history.pushState({ path }, "", url);
}

function renderBreadcrumb() {
  breadcrumb.innerHTML = "";
  const root = document.createElement("button");
  root.textContent = "全部文件";
  root.addEventListener("click", () => {
    exitTrashMode();
    exitStarredMode();
    loadFolder("");
  });
  breadcrumb.append(root);

  if (state.trashMode) {
    const slash = document.createElement("span");
    slash.textContent = "/";
    const trashLabel = document.createElement("span");
    trashLabel.className = "breadcrumb-current";
    trashLabel.style.fontWeight = "600";
    trashLabel.textContent = "🗑️ 回收站";
    breadcrumb.append(slash, trashLabel);
    return;
  }

  if (state.starredMode) {
    const slash = document.createElement("span");
    slash.textContent = "/";
    const starredLabel = document.createElement("span");
    starredLabel.className = "breadcrumb-current";
    starredLabel.style.fontWeight = "600";
    starredLabel.textContent = "⭐ 我的星标";
    breadcrumb.append(slash, starredLabel);
    return;
  }

  let current = "";
  for (const part of state.path.split("/").filter(Boolean)) {
    const slash = document.createElement("span");
    slash.textContent = "/";
    breadcrumb.append(slash);

    current = joinPath(current, part);
    const button = document.createElement("button");
    button.textContent = part;
    button.addEventListener("click", () => loadFolder(current));
    breadcrumb.append(button);
  }
}

function areFolderItemsEqual(a = [], b = []) {
  if (a === b) return true;
  if (!a || !b || a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    const itemA = a[i];
    const itemB = b[i];
    if (
      itemA.path !== itemB.path ||
      itemA.size !== itemB.size ||
      itemA.modifiedAt !== itemB.modifiedAt ||
      itemA.type !== itemB.type ||
      itemA.locked !== itemB.locked ||
      itemA.unlocked !== itemB.unlocked
    ) {
      return false;
    }
  }
  return true;
}

function actionButton(label, className, handler) {
  const button = document.createElement("button");
  button.textContent = label;
  if (className) button.className = className;
  button.addEventListener("click", handler);
  return button;
}

function actionIconButton({ iconSvg, title, className = "", handler }) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `row-action-icon-btn ${className}`.trim();
  button.title = title;
  button.setAttribute("aria-label", title);
  button.innerHTML = iconSvg;
  if (handler) {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      handler(event);
    });
  }
  return button;
}

function aiActionSlot(item, options = {}, index = 0) {
  if (!state.aiModeEnabled) return null;
  const aiSvgHtml = `<svg class="action-btn-svg ai-chat-sparkle-svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/><path d="M12 7.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z" fill="currentColor" stroke="none"/></svg>`;
  const btn = actionIconButton({
    iconSvg: aiSvgHtml,
    title: "AI 智能对话 / 提炼分析",
    className: "ai-action-btn",
    handler: () => openAiChatPlaceholder(item),
  });
  if (options.animateAi) {
    btn.classList.add("ai-animate-in");
    btn.style.animationDelay = `${Math.min(index * 24, 200)}ms`;
    btn.addEventListener("animationend", () => {
      btn.classList.remove("ai-animate-in");
      btn.style.animationDelay = "";
    }, { once: true });
  }
  return btn;
}

function prefersClickRowActionMenu() {
  const coarsePointer = window.matchMedia?.("(pointer: coarse)")?.matches;
  const noHover = window.matchMedia?.("(hover: none)")?.matches;
  return Boolean(coarsePointer || noHover);
}

function closeRowActionMenus(exceptMenu = null) {
  document.querySelectorAll(".row-action-menu").forEach((menu) => {
    if (menu === exceptMenu) return;
    if (typeof menu.closeRowActionMenu === "function") {
      menu.closeRowActionMenu();
      return;
    }
    menu.classList.add("hidden");
    menu.style.top = "";
    menu.style.left = "";
  });
  document.querySelectorAll(".row-action-menu-bridge").forEach((bridge) => {
    if (exceptMenu && bridge.dataset.menuId === exceptMenu.id) return;
    bridge.classList.add("hidden");
    bridge.style.top = "";
    bridge.style.left = "";
    bridge.style.width = "";
    bridge.style.height = "";
  });
  document.querySelectorAll(".row-actions-more[aria-expanded='true']").forEach((button) => {
    const menuId = button.getAttribute("aria-controls");
    if (exceptMenu && exceptMenu.id === menuId) return;
    button.setAttribute("aria-expanded", "false");
  });
  document.querySelectorAll(".row-actions.has-active-menu").forEach((el) => {
    if (exceptMenu && el.querySelector(`[aria-controls='${exceptMenu.id}']`)) return;
    el.classList.remove("has-active-menu");
  });
}

function positionRowActionMenu(trigger, menu, bridge = null) {
  const rect = trigger.getBoundingClientRect();
  const menuRect = menu.getBoundingClientRect();
  const menuWidth = menuRect.width || menu.offsetWidth || 108;
  const menuHeight = menuRect.height || menu.offsetHeight || 120;
  const gap = 6;
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  // 边界约束：不能超出文件面板区域或视口
  const filePanel = document.querySelector(".file-panel");
  const panelRect = filePanel?.getBoundingClientRect();
  const maxRight = panelRect ? Math.min(viewportWidth - 12, panelRect.right - 8) : (viewportWidth - 12);
  const minLeft = panelRect ? Math.max(12, panelRect.left + 8) : 12;

  let left;
  let top;
  let placement = "bottom-end";

  // 优先采用标准的垂直右对齐展开（右边缘对齐“更多”按钮），避免向左弹出时遮挡本行操作按钮
  left = Math.min(maxRight - menuWidth, Math.max(minLeft, rect.right - menuWidth));

  const bottomSpace = viewportHeight - (rect.bottom + gap);
  if (bottomSpace >= menuHeight + 8) {
    top = rect.bottom + gap;
    placement = "bottom-end";
  } else if (rect.top - gap >= menuHeight + 8) {
    top = rect.top - gap - menuHeight;
    placement = "top-end";
  } else {
    // 垂直空间极端紧张时备用侧向
    if (rect.right + gap + menuWidth <= maxRight) {
      left = rect.right + gap;
      top = rect.top + (rect.height - menuHeight) / 2;
      placement = "right";
    } else {
      left = Math.max(minLeft, rect.left - gap - menuWidth);
      top = rect.top + (rect.height - menuHeight) / 2;
      placement = "left";
    }
  }

  if (top + menuHeight > viewportHeight - 12) {
    top = viewportHeight - menuHeight - 12;
  }
  top = Math.max(12, top);

  menu.style.left = `${Math.round(left)}px`;
  menu.style.top = `${Math.round(top)}px`;
  menu.dataset.placement = placement;

  if (bridge) {
    const padding = 6;
    const bridgeLeft = Math.min(rect.left, left) - padding;
    const bridgeRight = Math.max(rect.right, left + menuWidth) + padding;
    const bridgeTop = Math.min(rect.top, top) - padding;
    const bridgeBottom = Math.max(rect.bottom, top + menuHeight) + padding;
    bridge.style.left = `${Math.round(bridgeLeft)}px`;
    bridge.style.top = `${Math.round(bridgeTop)}px`;
    bridge.style.width = `${Math.max(0, Math.round(bridgeRight - bridgeLeft))}px`;
    bridge.style.height = `${Math.round(bridgeBottom - bridgeTop)}px`;
    return { left: bridgeLeft, right: bridgeRight, top: bridgeTop, bottom: bridgeBottom };
  }
  return { left, right: left + menuWidth, top, bottom: top + menuHeight };
}

function moreActionsMenu(items = []) {
  const wrapper = document.createElement("div");
  wrapper.className = "row-actions-menu-wrap";
  let hoverBounds = null;
  const useClickMode = prefersClickRowActionMenu();

  function hideMenu() {
    menu.classList.add("hidden");
    bridge.classList.add("hidden");
    menu.style.top = "";
    menu.style.left = "";
    bridge.style.top = "";
    bridge.style.left = "";
    bridge.style.width = "";
    bridge.style.height = "";
    hoverBounds = null;
    document.removeEventListener("pointermove", handlePointerMove);
    trigger.setAttribute("aria-expanded", "false");
    wrapper.closest(".row-actions")?.classList.remove("has-active-menu");
  }

  function isInsideHoverBounds(event) {
    if (!hoverBounds) return false;
    return (
      event.clientX >= hoverBounds.left &&
      event.clientX <= hoverBounds.right &&
      event.clientY >= hoverBounds.top &&
      event.clientY <= hoverBounds.bottom
    );
  }

  function handlePointerMove(event) {
    if (!menu.classList.contains("hidden") && !isInsideHoverBounds(event)) hideMenu();
  }

  let openedByPointerAt = 0;

  function showMenu() {
    closeRowActionMenus(menu);
    menu.classList.remove("hidden");
    bridge.classList.remove("hidden");
    hoverBounds = positionRowActionMenu(trigger, menu, bridge);
    if (!useClickMode) document.addEventListener("pointermove", handlePointerMove);
    trigger.setAttribute("aria-expanded", "true");
    wrapper.closest(".row-actions")?.classList.add("has-active-menu");
    openedByPointerAt = Date.now();
  }

  function toggleMenu(event) {
    event.stopPropagation();
    event.preventDefault();
    if (!menu.classList.contains("hidden") && Date.now() - openedByPointerAt < 400) {
      return;
    }
    if (menu.classList.contains("hidden")) {
      showMenu();
    } else {
      hideMenu();
    }
  }

  const menuId = `row-action-menu-${Math.random().toString(36).slice(2, 10)}`;
  const moreSvg = `<svg class="action-btn-svg" viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="2.2"/><circle cx="12" cy="12" r="2.2"/><circle cx="19" cy="12" r="2.2"/></svg>`;
  const trigger = actionIconButton({
    iconSvg: moreSvg,
    title: "更多操作",
    className: "ghost row-actions-more more-action-btn",
    handler: toggleMenu,
  });
  trigger.setAttribute("aria-haspopup", "menu");
  trigger.setAttribute("aria-expanded", "false");
  trigger.setAttribute("aria-controls", menuId);
  if (!useClickMode) trigger.addEventListener("pointerenter", showMenu);
  if (!useClickMode) trigger.addEventListener("focus", showMenu);

  const menu = document.createElement("div");
  menu.className = "row-action-menu hidden";
  menu.id = menuId;
  menu.setAttribute("role", "menu");
  menu.closeRowActionMenu = hideMenu;

  const bridge = document.createElement("div");
  bridge.className = "row-action-menu-bridge hidden";
  bridge.dataset.menuId = menuId;

  items.forEach(({ label, handler, danger = false }) => {
    const itemButton = document.createElement("button");
    itemButton.type = "button";
    itemButton.textContent = label;
    itemButton.className = danger ? "danger-text" : "";
    itemButton.setAttribute("role", "menuitem");
    itemButton.addEventListener("click", async (event) => {
      event.stopPropagation();
      closeRowActionMenus();
      await handler();
    });
    itemButton.addEventListener("blur", () => {
      if (!menu.contains(document.activeElement)) hideMenu();
    });
    menu.append(itemButton);
  });

  wrapper.append(trigger);
  document.body.append(menu);
  document.body.append(bridge);
  return wrapper;
}

document.addEventListener("click", () => closeRowActionMenus());
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeRowActionMenus();
});
window.addEventListener("resize", () => closeRowActionMenus());
document.querySelector(".file-panel")?.addEventListener("scroll", () => closeRowActionMenus(), { passive: true });

function itemKeyOf(item) {
  return item ? (item.path || item.id || item.trashId || "") : "";
}

function handleRangeSelection(targetItem, { append = false } = {}) {
  const targetKey = itemKeyOf(targetItem);
  if (!targetKey || !state.items || state.items.length === 0) return;

  const targetIdx = state.items.findIndex((it) => itemKeyOf(it) === targetKey);
  if (targetIdx === -1) return;

  let anchorIdx = -1;
  if (state.lastAnchorKey) {
    anchorIdx = state.items.findIndex((it) => itemKeyOf(it) === state.lastAnchorKey);
  }

  if (anchorIdx === -1) {
    anchorIdx = 0;
    state.lastAnchorKey = itemKeyOf(state.items[0]);
  }

  const start = Math.min(anchorIdx, targetIdx);
  const end = Math.max(anchorIdx, targetIdx);

  if (!append) {
    state.selectedPaths.clear();
  }

  for (let i = start; i <= end; i++) {
    const it = state.items[i];
    if (it) {
      state.selectedPaths.add(itemKeyOf(it));
    }
  }

  state.selectionMode = state.selectedPaths.size > 0;
  updateSelectionUi();
  syncSelectionRows();

  window.getSelection()?.removeAllRanges();
}

function handleToggleSelection(targetItem) {
  const targetKey = itemKeyOf(targetItem);
  if (!targetKey) return;

  if (state.selectedPaths.has(targetKey)) {
    state.selectedPaths.delete(targetKey);
  } else {
    state.selectedPaths.add(targetKey);
  }

  state.lastAnchorKey = targetKey;
  state.selectionMode = state.selectedPaths.size > 0;
  updateSelectionUi();
  syncSelectionRows();
}

function selectedItems() {
  return state.items.filter((item) => state.selectedPaths.has(item.path || item.id || item.trashId));
}

function clearSelection() {
  state.selectedPaths.clear();
  state.selectionMode = false;
  state.lastAnchorKey = "";
  updateSelectionUi();
  syncSelectionRows();
  if (!state.trashMode && !state.starredMode) void flushPendingRealtimeRefresh();
}

function updateSelectionUi() {
  const count = state.selectedPaths.size;
  document.body.classList.toggle("selection-active", state.selectionMode);
  selectionBar.classList.toggle("hidden", !state.selectionMode);
  selectionCount.textContent = `已选择 ${count} 项`;

  if (state.trashMode) {
    if (normalSelectionActions) normalSelectionActions.classList.add("hidden");
    if (trashSelectionActions) trashSelectionActions.classList.remove("hidden");
    if (bulkRestoreTrashBtn) bulkRestoreTrashBtn.disabled = count === 0;
    if (bulkPermanentDeleteBtn) bulkPermanentDeleteBtn.disabled = count === 0;
  } else {
    if (normalSelectionActions) normalSelectionActions.classList.remove("hidden");
    if (trashSelectionActions) trashSelectionActions.classList.add("hidden");
    if (bulkStarBtn) {
      bulkStarBtn.disabled = count === 0;
      if (count > 0) {
        const allStarred = Array.from(state.selectedPaths).every((p) => {
          const found = state.items.find((it) => it.path === p);
          return found && found.starred;
        });
        bulkStarBtn.textContent = allStarred ? "☆ 取消星标" : "⭐ 设为星标";
      } else {
        bulkStarBtn.textContent = "⭐ 设为星标";
      }
    }
    if (bulkDownloadBtn) bulkDownloadBtn.disabled = count === 0;
    if (bulkShareBtn) bulkShareBtn.disabled = count === 0;
    if (bulkCopyBtn) bulkCopyBtn.disabled = count === 0;
    if (bulkMoveBtn) bulkMoveBtn.disabled = count === 0;
    if (bulkDeleteBtn) bulkDeleteBtn.disabled = count === 0;
  }
  const selectModeText = selectModeBtn.querySelector(".btn-text");
  if (selectModeText) {
    selectModeText.textContent = state.selectionMode ? "完成" : "多选";
  } else {
    selectModeBtn.innerHTML = `<svg class="btn-icon" width="16" height="16" style="width:16px;height:16px;flex-shrink:0;" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><rect x="2.5" y="2.5" width="11" height="11" rx="2.5" stroke="currentColor" stroke-width="1.5"/><path d="M5.2 8L7.1 10L10.8 5.8" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg><span class="btn-text">${state.selectionMode ? "完成" : "多选"}</span>`;
  }
}

function syncSelectionRows() {
  for (const row of fileRows.querySelectorAll("tr[data-path]")) {
    const selected = state.selectedPaths.has(row.dataset.path);
    row.classList.toggle("selected-row", selected);
    const checkbox = row.querySelector(".row-select");
    if (checkbox) checkbox.checked = selected;
  }
  if (headerSelectAll) {
    const total = state.items.length;
    const count = state.selectedPaths.size;
    const allSelected = total > 0 && count >= total;
    headerSelectAll.checked = allSelected;
    headerSelectAll.indeterminate = count > 0 && !allSelected;
  }
}

function toggleSelectionMode(force) {
  state.selectionMode = typeof force === "boolean" ? force : !state.selectionMode;
  if (!state.selectionMode) state.selectedPaths.clear();
  updateSelectionUi();
  syncSelectionRows();
  if (!state.selectionMode && !state.trashMode) void flushPendingRealtimeRefresh();
}

function toggleItemSelection(item, checked) {
  const key = item.path || item.id || item.trashId;
  if (checked) state.selectedPaths.add(key);
  else state.selectedPaths.delete(key);
  updateSelectionUi();
  syncSelectionRows();
}

function toggleAllSelection() {
  const total = state.items.length;
  if (total === 0) return;
  const allSelected = state.items.every((item) => state.selectedPaths.has(item.path || item.id || item.trashId));
  state.selectedPaths.clear();
  if (!allSelected) {
    state.items.forEach((item) => state.selectedPaths.add(item.path || item.id || item.trashId));
  }
  state.selectionMode = state.selectedPaths.size > 0;
  updateSelectionUi();
  syncSelectionRows();
  if (!state.selectionMode && !state.trashMode) void flushPendingRealtimeRefresh();
}

async function downloadFile(item) {
  const folderPasswords = {};
  try {
    const data = await resolveDownloadLink(item.path, folderPasswords);
    window.location.href = data.url;
  } catch (error) {
    if (error.code === "FOLDER_LOCKED" && error.folderPath) {
      const ok = await unlockFolder(error.folderPath, displayFolder(error.folderPath));
      if (ok) return downloadFile(item);
      return;
    }
    if (error.canceled) return;
    await showErrorDialog(error.message);
    setStatus(error.message);
  }
}

async function resolveDownloadLink(path, folderPasswords = {}) {
  while (true) {
    try {
      return await requestDownloadLink(path, folderPasswords);
    } catch (error) {
      if (error.code !== "FOLDER_DOWNLOAD_LOCKED" || !error.folderPath) throw error;
      const password = await promptDownloadPassword(error.folderPath);
      if (password === null) throw Object.assign(new Error("已取消下载"), { canceled: true });
      folderPasswords[error.folderPath] = password;
    }
  }
}

async function requestDownloadLink(path, folderPasswords = {}) {
  return api("/api/download-link", {
    method: "POST",
    body: JSON.stringify({ path, folderPasswords }),
  });
}

async function promptDownloadPassword(folderPath) {
  const result = await openFolderPasswordDialog({
    mode: "download",
    folderPath,
    folderName: displayFolder(folderPath),
    async submit(password) {
      await api("/api/folder-unlock", {
        method: "POST",
        body: JSON.stringify({ path: folderPath, password }),
      });
      markFolderUnlockedEverywhere(folderPath);
      return password;
    },
  });
  return result === null ? null : result;
}

function fileMeta(item) {
  const isDir = Boolean(item && (item.type === "folder" || item.isDirectory));
  if (isDir) {
    const lockState = item.locked ? (isFolderUnlocked(item.path) ? "unlocked" : "locked") : "";
    return {
      label: lockLabel(item),
      className: item.locked ? `folder ${lockState}` : "folder",
      lockState,
    };
  }
  const ext = fileExt(item?.name || "");
  if (ext === "pdf") return { label: "PDF", className: "pdf", lockState: "" };
  if (["doc", "docx", "wps", "dot", "dotx", "odt", "rtf"].includes(ext)) return { label: "DOC", className: "word", lockState: "" };
  if (["ppt", "pptx", "pot", "potx", "pps", "ppsx", "odp"].includes(ext)) return { label: "PPT", className: "ppt", lockState: "" };
  if (["xls", "xlsx", "xlsm", "xltx", "csv", "tsv", "ods"].includes(ext)) return { label: "XLS", className: "excel", lockState: "" };
  if (["zip", "rar", "7z", "tar", "gz", "bz2", "xz", "iso"].includes(ext)) return { label: "", className: "archive", lockState: "" };
  if (["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg", "ico", "tif", "tiff"].includes(ext)) return { label: "IMG", className: "image", lockState: "" };
  if (["mp4", "mov", "mkv", "webm", "avi", "flv", "wmv", "m4v", "3gp"].includes(ext)) return { label: "VID", className: "media", lockState: "" };
  if (["mp3", "wav", "flac", "ogg", "m4a", "aac", "wma"].includes(ext)) return { label: "AUD", className: "audio", lockState: "" };
  if (["txt", "md", "markdown", "json", "js", "jsx", "ts", "tsx", "css", "html", "xml", "log", "py", "c", "cpp", "h", "java", "sh", "bat", "sql", "yaml", "yml"].includes(ext)) {
    return { label: "TXT", className: "text", lockState: "" };
  }
  return { label: ext ? ext.slice(0, 3).toUpperCase() : "FILE", className: "file", lockState: "" };
}

function renderFileIcon(item, { baseClass = "file-icon" } = {}) {
  const icon = document.createElement("span");
  const meta = fileMeta(item);
  icon.className = `${baseClass} ${meta.className}`;
  const isDir = Boolean(item && (item.type === "folder" || item.isDirectory));
  icon.textContent = isDir ? "" : meta.label;
  icon.setAttribute("aria-hidden", "true");
  if (meta.lockState) {
    const badge = document.createElement("span");
    badge.className = `lock-badge ${meta.lockState}`;
    badge.setAttribute("aria-hidden", "true");
    icon.append(badge);
  }
  if (meta.className === "archive") {
    const zipper = document.createElement("span");
    zipper.className = "zip-zipper";
    zipper.setAttribute("aria-hidden", "true");
    icon.append(zipper);
  }
  return icon;
}

const SEARCH_CATEGORIES = [
  { value: "all", label: "全部" },
  { value: "folder", label: "文件夹" },
  { value: "document", label: "文档" },
  { value: "image", label: "图片" },
  { value: "video", label: "视频" },
  { value: "other", label: "其他" },
];

function localSearchTokens(input = "") {
  return String(input || "")
    .trim()
    .toLowerCase()
    .split(/[\s,，;；]+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 12);
}

function escapeRegExp(text) {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function appendHighlightedText(target, text, tokens = []) {
  const value = String(text || "");
  const cleanTokens = [...new Set(tokens.map((token) => String(token || "").trim()).filter(Boolean))]
    .sort((a, b) => b.length - a.length);
  if (!value || !cleanTokens.length) {
    target.append(document.createTextNode(value));
    return;
  }
  const regex = new RegExp(cleanTokens.map(escapeRegExp).join("|"), "gi");
  let lastIndex = 0;
  let match;
  while ((match = regex.exec(value))) {
    if (match.index > lastIndex) {
      target.append(document.createTextNode(value.slice(lastIndex, match.index)));
    }
    const mark = document.createElement("mark");
    mark.className = "search-highlight";
    mark.textContent = match[0];
    target.append(mark);
    lastIndex = match.index + match[0].length;
    if (regex.lastIndex === match.index) regex.lastIndex += 1;
  }
  if (lastIndex < value.length) {
    target.append(document.createTextNode(value.slice(lastIndex)));
  }
}

function searchItemCategory(item) {
  if (item.type === "folder" || item.isDirectory) return "folder";
  const ext = fileExt(item.name);
  if (["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg", "ico", "tif", "tiff"].includes(ext)) return "image";
  if (["mp4", "mov", "mkv", "webm", "avi", "flv", "wmv", "m4v", "3gp"].includes(ext)) return "video";
  if (["pdf", "doc", "docx", "wps", "dot", "dotx", "odt", "rtf", "ppt", "pptx", "pot", "potx", "pps", "ppsx", "odp", "xls", "xlsx", "xlsm", "xltx", "csv", "tsv", "ods", "txt", "md", "markdown", "json", "js", "jsx", "ts", "tsx", "html", "xml", "log", "py", "c", "cpp", "h", "java", "sh", "bat", "sql", "yaml", "yml"].includes(ext)) return "document";
  return "other";
}

function searchCategoryCounts(items) {
  const counts = Object.fromEntries(SEARCH_CATEGORIES.map((category) => [category.value, 0]));
  counts.all = items.length;
  for (const item of items) {
    const category = searchItemCategory(item);
    counts[category] = (counts[category] || 0) + 1;
  }
  return counts;
}

function renderSearchCategoryTabs() {
  if (!searchCategoryTabs) return;
  const counts = searchCategoryCounts(state.searchRawItems);
  searchCategoryTabs.innerHTML = "";
  for (const category of SEARCH_CATEGORIES) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "search-tab";
    button.classList.toggle("active", state.searchCategory === category.value);
    button.textContent = `${category.label} ${counts[category.value] || 0}`;
    button.addEventListener("click", () => {
      state.searchCategory = category.value;
      updateSearchVisibleItems({ render: true });
    });
    searchCategoryTabs.append(button);
  }
}

function syncSearchSummaryCount() {
  if (!searchSummary || !state.searchActive || !searchSummary.textContent) return;
  const total = state.searchRawItems.length;
  const shown = state.items.length;
  searchSummary.textContent = searchSummary.textContent.replace(/找到 \d+ 项，当前显示 \d+ 项/, `找到 ${total} 项，当前显示 ${shown} 项`);
}

function searchRelevanceScore(item) {
  const reason = item.matchReason || "";
  let score = 0;
  if (reason.includes("名称")) score += 60;
  if (reason.includes("内容")) score += 45;
  if (reason.includes("路径")) score += 25;
  if (reason.includes("类型")) score += 18;
  if (reason.includes("时间")) score += 12;
  if (reason.includes("大小")) score += 8;
  if (item.type === "folder") score += 4;
  const name = itemName(item).toLowerCase();
  for (const token of state.searchTokens) {
    if (name === token) score += 80;
    else if (name.includes(token)) score += 35;
  }
  return score;
}

function compareSearchItems(a, b) {
  const sortMode = searchSort?.value || state.searchSort || "relevance";
  if (sortMode === "modifiedDesc") {
    return new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime();
  }
  if (sortMode === "sizeDesc") {
    return (b.size || 0) - (a.size || 0);
  }
  if (sortMode === "type") {
    const category = searchItemCategory(a).localeCompare(searchItemCategory(b), "zh-CN");
    if (category) return category;
    return itemName(a).localeCompare(itemName(b), "zh-CN");
  }
  if (sortMode === "name") {
    return itemName(a).localeCompare(itemName(b), "zh-CN");
  }
  const score = searchRelevanceScore(b) - searchRelevanceScore(a);
  if (score) return score;
  return itemName(a).localeCompare(itemName(b), "zh-CN");
}

function updateSearchVisibleItems(options = {}) {
  const rawItems = state.searchRawItems || [];
  const filtered = state.searchCategory === "all"
    ? [...rawItems]
    : rawItems.filter((item) => searchItemCategory(item) === state.searchCategory);
  state.searchSort = searchSort?.value || state.searchSort || "relevance";
  state.items = filtered.sort(compareSearchItems);
  renderSearchCategoryTabs();
  const visiblePaths = new Set(state.items.map((item) => item.path));
  for (const selectedPath of [...state.selectedPaths]) {
    if (!visiblePaths.has(selectedPath)) state.selectedPaths.delete(selectedPath);
  }
  state.selectionMode = state.selectedPaths.size > 0;
  updateSelectionUi();
  syncSearchSummaryCount();
  if (options.render) renderRows({ noAnimation: true });
}

async function renameItem(item) {
  const result = await openDialog({
    eyebrow: "重命名",
    title: "重命名项目",
    description: `请输入“${itemName(item)}”的新名称。`,
    input: { label: "新名称", value: itemName(item) },
    validate(value) {
      if (!value.trim()) return "请输入新的名称";
      return "";
    },
  });
  const name = result?.value?.trim();
  if (!name || name === item.name || name === itemName(item)) return;
  await runAction(() => api("/api/rename", {
    method: "POST",
    body: JSON.stringify({ path: item.path, name }),
  }));
}

async function copyItem(item) {
  const data = await getFolderList();
  const options = folderSelectOptions(data.folders, {
    excludeInside: item.type === "folder" ? item.path : "",
  });
  const result = await openDialog({
    eyebrow: "复制",
    title: "复制项目",
    description: `请选择要把“${itemName(item)}”复制进去的目标文件夹。`,
    select: {
      label: "目标文件夹",
      value: state.path,
      options,
    },
    validate(first, second, selected) {
      if (!options.some((option) => option.value === selected)) return "请选择有效的目标文件夹";
      return "";
    },
  });
  if (result === null) return;
  const targetDir = result.selectedValue;
  await runAction(() => api("/api/copy", {
    method: "POST",
    body: JSON.stringify({ source: item.path, targetDir }),
  }));
}

async function moveItem(item) {
  const data = await getFolderList();
  const options = folderSelectOptions(data.folders, {
    excludeInside: item.type === "folder" ? item.path : "",
  });
  const result = await openDialog({
    eyebrow: "移动",
    title: "移动项目",
    description: `请选择要把“${itemName(item)}”移动进去的目标文件夹。`,
    select: {
      label: "目标文件夹",
      value: parentPath(item.path),
      options,
    },
    validate(first, second, selected) {
      if (!options.some((option) => option.value === selected)) return "请选择有效的目标文件夹";
      return "";
    },
  });
  if (result === null) return;
  const targetDir = result.selectedValue;
  await runAction(() => api("/api/move", {
    method: "POST",
    body: JSON.stringify({ source: item.path, targetDir }),
  }));
}

async function deleteItem(item) {
  const isLockedFolder = item.type === "folder" && item.locked;
  let verified = null;
  if (isLockedFolder) {
    verified = await verifyFolderDeletion(item);
    if (!verified) return;
  }
  const ok = await showConfirmDialog("删除项目", `确认删除“${itemName(item)}”吗？`);
  if (!ok) return;
  await runAction(() => api("/api/item", {
    method: "DELETE",
    body: JSON.stringify(
      isLockedFolder
        ? {
            path: item.path,
            adminPassword: verified.adminPassword,
            currentPassword: verified.currentPassword,
          }
        : { path: item.path }
    ),
  }));
}

async function restoreTrashItem(item) {
  const id = item.id || item.trashId;
  try {
    suppressNextRealtimeRefresh();
    const res = await api("/api/trash/restore", {
      method: "POST",
      body: JSON.stringify({ id, trashId: id }),
    });
    setStatus(res.message || `已还原“${item.name}”`);
    clearFolderCaches();
    scheduleStorageUsageRefresh({ force: true });
    await loadTrash();
  } catch (err) {
    showErrorDialog(err.message || "还原失败");
  }
}

async function permanentDeleteTrashItem(item) {
  const ok = await showConfirmDialog("彻底删除", `确认永久删除“${item.name}”吗？此操作无法撤销。`);
  if (!ok) return;
  const id = item.id || item.trashId;
  try {
    suppressNextRealtimeRefresh();
    const res = await api("/api/trash/permanent", {
      method: "DELETE",
      body: JSON.stringify({ id, trashId: id }),
    });
    setStatus(res.message || `已彻底删除“${item.name}”`);
    scheduleStorageUsageRefresh({ force: true });
    await loadTrash();
  } catch (err) {
    showErrorDialog(err.message || "删除失败");
  }
}

async function executeOpenItem(item) {
  if (item.type === "folder" || item.isDirectory) {
    const ok = await ensureFolderReady(item.path, itemName(item));
    if (ok) {
      if (state.starredMode) exitStarredMode();
      loadFolder(item.path);
    }
  } else if (fileExt(item.name) === "zip") {
    openZipArchiveModal(item);
  } else {
    openPreview(item);
  }
}

function renderRows(options = {}) {
  closeContextMenu();
  closeRowActionMenus();
  document.querySelectorAll(".row-action-menu").forEach((menu) => menu.remove());
  document.querySelectorAll(".row-action-menu-bridge").forEach((bridge) => bridge.remove());
  fileRows.innerHTML = "";
  emptyState.classList.toggle("hidden", state.items.length > 0);
  const emptyTitle = emptyState.querySelector("strong");
  const emptyText = emptyState.querySelector("span");
  if (state.trashMode) {
    if (emptyTitle) emptyTitle.textContent = "回收站是空的";
    if (emptyText) emptyText.textContent = "没有已删除的文件或文件夹（保留30天内删除的内容）。";
  } else if (state.starredMode) {
    if (emptyTitle) emptyTitle.textContent = "暂无星标内容";
    if (emptyText) emptyText.textContent = "可以将重要的文件或文件夹设为星标，以便在此快速查找。";
  } else if (state.searchActive) {
    if (emptyTitle) emptyTitle.textContent = "没有找到匹配结果";
    if (emptyText) emptyText.textContent = "可以换一个文件名、路径、类型、日期或大小关键词再试。";
  } else {
    if (emptyTitle) emptyTitle.textContent = "这个文件夹还是空的";
    if (emptyText) emptyText.textContent = "点击上传文件，或把文件拖到这里";
  }

  const folders = state.items.filter((item) => item.type === "folder" || item.isDirectory).length;
  const files = state.items.length - folders;
  folderCount.textContent = folders;
  fileCount.textContent = files;

  if (state.trashMode) {
    const fragment = document.createDocumentFragment();
    state.items.forEach((item) => {
      const itemKey = item.path || item.id || item.trashId;
      const isSelected = state.selectedPaths.has(itemKey);

      const tr = document.createElement("tr");
      tr.classList.add("no-row-animation");
      tr.dataset.path = itemKey;
      tr.classList.toggle("selected-row", isSelected);

      const selectTd = document.createElement("td");
      selectTd.className = "select-col";
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.className = "row-select";
      checkbox.checked = isSelected;
      checkbox.setAttribute("aria-label", `选择 ${item.name}`);
      checkbox.addEventListener("click", (event) => {
        if (event.shiftKey) {
          event.preventDefault();
          handleRangeSelection(item, { append: Boolean(event.ctrlKey || event.metaKey) });
          return;
        }
        event.stopPropagation();
      });
      checkbox.addEventListener("change", () => {
        state.selectionMode = true;
        toggleItemSelection(item, checkbox.checked);
        state.lastAnchorKey = itemKey;
      });
      selectTd.append(checkbox);

      tr.addEventListener("click", (event) => {
        if (event.target.closest("button") || event.target.closest("a") || event.target.closest("input")) return;
        if (event.shiftKey) {
          event.preventDefault();
          handleRangeSelection(item, { append: Boolean(event.ctrlKey || event.metaKey) });
          return;
        }
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          handleToggleSelection(item);
          return;
        }
        state.selectionMode = true;
        toggleItemSelection(item, !state.selectedPaths.has(itemKey));
        state.lastAnchorKey = itemKey;
      });

      const nameTd = document.createElement("td");
      const nameCell = document.createElement("div");
      nameCell.className = "name-cell";
      const icon = renderFileIcon(item);

      const nameLabel = document.createElement("span");
      nameLabel.style.fontWeight = "500";
      nameLabel.textContent = item.name;

      nameCell.append(icon, nameLabel);

      const pathMeta = document.createElement("div");
      pathMeta.className = "match-meta";
      pathMeta.style.color = "var(--text-secondary)";
      pathMeta.style.fontSize = "12px";
      const remainingDays = item.expireDaysLeft != null ? item.expireDaysLeft : 30;
      const origPath = item.originalPath || item.originalRelPath || "/";
      pathMeta.textContent = `原位置：${origPath} · 剩余 ${remainingDays} 天自动清除`;
      nameCell.append(pathMeta);
      nameTd.append(nameCell);

      const isDir = Boolean(item && (item.type === "folder" || item.isDirectory));
      const sizeTd = document.createElement("td");
      sizeTd.textContent = isDir ? "-" : formatSize(item.size);

      const timeTd = document.createElement("td");
      timeTd.textContent = formatTime(item.deletedAt);

      const actionsTd = document.createElement("td");
      const actions = document.createElement("div");
      actions.className = "row-actions";

      const restoreBtn = actionIconButton({
        iconSvg: `<svg class="action-btn-svg" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 10h10a5 5 0 0 1 5 5v2"/><path d="M7 6L3 10l4 4"/></svg>`,
        title: "还原项目",
        className: "restore-action-btn",
        handler: async (event) => {
          if (event) event.stopPropagation();
          await restoreTrashItem(item);
        },
      });

      const permanentDeleteBtn = actionIconButton({
        iconSvg: `<svg class="action-btn-svg" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>`,
        title: "彻底删除 (不可恢复)",
        className: "danger-action-btn",
        handler: async (event) => {
          if (event) event.stopPropagation();
          await permanentDeleteTrashItem(item);
        },
      });

      actions.append(restoreBtn, permanentDeleteBtn);
      actionsTd.append(actions);

      tr.append(selectTd, nameTd, sizeTd, timeTd, actionsTd);
      fragment.append(tr);
    });
    fileRows.append(fragment);
    return;
  }

  const fragment = document.createDocumentFragment();
  state.items.forEach((item, index) => {
    const tr = document.createElement("tr");
    tr.classList.add("no-row-animation");
    tr.draggable = true;
    tr.dataset.path = item.path;
    tr.dataset.type = item.type;
    tr.classList.toggle("selected-row", state.selectedPaths.has(item.path));

    const selectTd = document.createElement("td");
    selectTd.className = "select-col";
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "row-select";
    checkbox.checked = state.selectedPaths.has(item.path);
    checkbox.setAttribute("aria-label", `选择 ${itemName(item)}`);
    checkbox.addEventListener("click", (event) => {
      if (event.shiftKey) {
        event.preventDefault();
        handleRangeSelection(item, { append: Boolean(event.ctrlKey || event.metaKey) });
        return;
      }
      event.stopPropagation();
    });
    checkbox.addEventListener("change", () => {
      state.selectionMode = true;
      toggleItemSelection(item, checkbox.checked);
      state.lastAnchorKey = itemKeyOf(item);
    });
    selectTd.append(checkbox);

    const nameTd = document.createElement("td");
    const nameCell = document.createElement("div");
    nameCell.className = "name-cell";

    const starBtn = document.createElement("button");
    starBtn.type = "button";
    starBtn.className = `star-toggle-btn${item.starred ? " active" : ""}`;
    starBtn.title = item.starred ? "取消星标" : "设为星标";
    starBtn.setAttribute("aria-label", item.starred ? `取消“${itemName(item)}”的星标` : `将“${itemName(item)}”设为星标`);
    starBtn.innerHTML = item.starred
      ? `<svg class="star-icon" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`
      : `<svg class="star-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;
    starBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      toggleStarItem(item);
    });

    const icon = renderFileIcon(item);
    const nameWrap = document.createElement("div");
    nameWrap.className = "name-title-wrap";

    const nameBtn = document.createElement("button");
    nameBtn.className = "name-btn";
    if (state.searchActive) {
      appendHighlightedText(nameBtn, itemName(item), state.searchTokens);
    } else {
      nameBtn.textContent = itemName(item);
    }
    nameBtn.title = item.type === "folder" ? "进入文件夹" : (fileExt(item.name) === "zip" ? "浏览压缩包内容" : "预览文件");
    nameBtn.addEventListener("click", async (event) => {
      if (event.shiftKey) {
        event.preventDefault();
        event.stopPropagation();
        handleRangeSelection(item, { append: Boolean(event.ctrlKey || event.metaKey) });
        return;
      }
      if (event.ctrlKey || event.metaKey) {
        event.preventDefault();
        event.stopPropagation();
        handleToggleSelection(item);
        return;
      }
      state.lastAnchorKey = itemKeyOf(item);
      if (item.type === "folder") {
        const ok = await ensureFolderReady(item.path, itemName(item));
        if (ok) {
          if (state.starredMode) exitStarredMode();
          loadFolder(item.path);
        }
      } else if (fileExt(item.name) === "zip") {
        openZipArchiveModal(item);
      } else {
        openPreview(item);
      }
    });

    nameWrap.append(nameBtn, starBtn);
    nameCell.append(icon, nameWrap);
    if (state.searchActive || state.starredMode) {
      const meta = document.createElement("div");
      meta.className = "match-meta";
      const folderText = item.folderPath ? `位置：${item.folderPath}` : "位置：全部文件";
      if (state.starredMode) {
        meta.textContent = folderText;
      } else {
        appendHighlightedText(meta, `${item.matchReason || "匹配"} · ${folderText}`, state.searchTokens);
      }
      nameCell.append(meta);
      if (state.searchActive && item.matchSnippet) {
        const snippet = document.createElement("div");
        snippet.className = "match-snippet";
        appendHighlightedText(snippet, item.matchSnippet, state.searchTokens);
        nameCell.append(snippet);
      }
    }
    nameTd.append(nameCell);

    const sizeTd = document.createElement("td");
    sizeTd.textContent = formatSize(item.size);

    const timeTd = document.createElement("td");
    timeTd.textContent = formatTime(item.modifiedAt);

    const actionsTd = document.createElement("td");
    const actions = document.createElement("div");
    actions.className = "row-actions";

    const renameAction = () => renameItem(item);
    const copyAction = () => copyItem(item);
    const moveAction = () => moveItem(item);
    const deleteAction = () => deleteItem(item);

    const aiBtn = aiActionSlot(item, options, index);
    if (aiBtn) actions.append(aiBtn);

    actions.append(actionIconButton({
      iconSvg: `<svg class="action-btn-svg" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 15V3m0 12l-4-4m4 4l4-4M2 17l.6 2.1A2 2 0 0 0 4.5 21h15a2 2 0 0 0 1.9-1.9L22 17"/></svg>`,
      title: item.type === "folder" ? "下载文件夹 (打包为 ZIP)" : "下载文件",
      className: "download-action-btn",
      handler: () => downloadFile(item),
    }));

    if (item.type === "folder") {
      const isLocked = Boolean(item.locked);
      const lockSvg = isLocked
        ? `<svg class="action-btn-svg lock-closed-svg" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4.5" y="10.5" width="15" height="11" rx="2.5"/><path d="M8 10.5V7a4 4 0 0 1 8 0v3.5"/><circle cx="12" cy="15" r="1.2" fill="currentColor"/><path d="M12 16.2v1.8"/></svg>`
        : `<svg class="action-btn-svg lock-open-svg" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4.5" y="10.5" width="15" height="11" rx="2.5"/><path d="M8 10.5V7a4 4 0 0 1 7.8-1.2"/></svg>`;

      actions.append(actionIconButton({
        iconSvg: lockSvg,
        title: isLocked ? "修改文件夹密码 / 密码管理" : "加密文件夹 (设置访问密码)",
        className: `lock-action-btn ${isLocked ? "is-locked" : "is-unlocked"}`,
        handler: async () => {
          await runAction(() => openFolderPasswordSettings(item));
        },
      }));
    }

    actions.append(actionIconButton({
      iconSvg: `<svg class="action-btn-svg" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>`,
      title: "删除",
      className: "danger-action-btn",
      handler: deleteAction,
    }));
    const moreMenuOptions = [
      {
        label: item.starred ? "☆ 取消星标" : "⭐ 设为星标",
        handler: () => toggleStarItem(item),
      },
      { label: "重命名", handler: renameAction },
      { label: "复制", handler: copyAction },
      { label: "移动", handler: moveAction },
      { label: "🔗 分享", handler: () => openShareModal(item) },
    ];
    if (fileExt(item.name) === "zip") {
      moreMenuOptions.unshift({ label: "📦 查看压缩包内容", handler: () => openZipArchiveModal(item) });
    }
    actions.append(moreActionsMenu(moreMenuOptions));
    actionsTd.append(actions);

    tr.append(selectTd, nameTd, sizeTd, timeTd, actionsTd);
    tr.addEventListener("click", (event) => {
      if (event.target.closest("button") || event.target.closest("a") || event.target.closest("input")) return;
      if (event.shiftKey) {
        event.preventDefault();
        handleRangeSelection(item, { append: Boolean(event.ctrlKey || event.metaKey) });
        return;
      }
      if (event.ctrlKey || event.metaKey) {
        event.preventDefault();
        handleToggleSelection(item);
        return;
      }
      if (state.selectionMode) {
        toggleItemSelection(item, !state.selectedPaths.has(itemKeyOf(item)));
      }
      state.lastAnchorKey = itemKeyOf(item);
    });
    tr.addEventListener("dragstart", (event) => {
      state.draggedItemPath = item.path;
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("application/x-drive-path", item.path);
      event.dataTransfer.setData("text/plain", itemName(item));
      tr.classList.add("dragging-row");
    });
    tr.addEventListener("dragend", () => {
      state.draggedItemPath = "";
      tr.classList.remove("dragging-row");
      document.querySelectorAll(".drop-target-row").forEach((row) => row.classList.remove("drop-target-row"));
    });
    if (item.type === "folder") {
      tr.addEventListener("dragover", (event) => {
        const source = event.dataTransfer.getData("application/x-drive-path") || state.draggedItemPath;
        if (!source || source === item.path) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
        tr.classList.add("drop-target-row");
      });
      tr.addEventListener("dragleave", () => tr.classList.remove("drop-target-row"));
      tr.addEventListener("drop", async (event) => {
        const source = event.dataTransfer.getData("application/x-drive-path") || state.draggedItemPath;
        if (!source || source === item.path || event.dataTransfer.files.length) return;
        event.preventDefault();
        tr.classList.remove("drop-target-row");
        const sourceItem = state.items.find((entry) => entry.path === source);
        const sourceName = sourceItem ? itemName(sourceItem) : source.split("/").filter(Boolean).pop() || "选中项目";
        const ok = await showConfirmDialog("移动项目", `确认将“${sourceName}”移动到“${itemName(item)}”吗？`);
        if (!ok) return;
        await moveItemToFolder(source, item.path);
      });
    }
    fragment.append(tr);
  });
  fileRows.append(fragment);
}

/* =========================================================================
   桌面级鼠标右键上下文菜单核心系统 (Desktop Context Menu Subsystem)
   ========================================================================= */

const CONTEXT_MENU_ICONS = {
  open: `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`,
  folderOpen: `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>`,
  archive: `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>`,
  sparkle: `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/></svg>`,
  aiChat: `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/><path d="M12 7.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z" fill="currentColor" stroke="none"/></svg>`,
  download: `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 15V3m0 12l-4-4m4 4l4-4M2 17l.6 2.1A2 2 0 0 0 4.5 21h15a2 2 0 0 0 1.9-1.9L22 17"/></svg>`,
  share: `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>`,
  starFilled: `<svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
  starEmpty: `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
  lockClosed: `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4.5" y="10.5" width="15" height="11" rx="2.5"/><path d="M8 10.5V7a4 4 0 0 1 8 0v3.5"/><circle cx="12" cy="15" r="1.2" fill="currentColor"/><path d="M12 16.2v1.8"/></svg>`,
  lockOpen: `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4.5" y="10.5" width="15" height="11" rx="2.5"/><path d="M8 10.5V7a4 4 0 0 1 7.8-1.2"/></svg>`,
  pencil: `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>`,
  copy: `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`,
  move: `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/><line x1="12" y1="11" x2="12" y2="17"/><polyline points="9 14 12 11 15 14"/></svg>`,
  trash: `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>`,
  restore: `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 10h10a5 5 0 0 1 5 5v2"/><path d="M7 6L3 10l4 4"/></svg>`,
};

let activeContextMenuRow = null;
let contextMenuDismissBound = false;

function getOrCreateContextMenuElement() {
  let menu = document.getElementById("customContextMenu");
  if (!menu) {
    menu = document.createElement("div");
    menu.id = "customContextMenu";
    menu.className = "desktop-context-menu hidden";
    menu.setAttribute("role", "menu");
    menu.setAttribute("aria-hidden", "true");
    document.body.appendChild(menu);
  }
  return menu;
}

function buildContextMenuItems(item, isMultiSelect) {
  if (state.trashMode) {
    if (isMultiSelect) {
      const count = state.selectedPaths.size;
      return [
        { type: "header", label: `已选择 ${count} 项` },
        {
          type: "item",
          label: `批量还原 (${count}项)`,
          iconSvg: CONTEXT_MENU_ICONS.restore,
          handler: bulkRestoreSelectedTrash,
        },
        { type: "divider" },
        {
          type: "item",
          label: `彻底删除 (${count}项)`,
          className: "danger-item",
          iconSvg: CONTEXT_MENU_ICONS.trash,
          handler: bulkPermanentDeleteSelectedTrash,
        },
      ];
    }

    return [
      {
        type: "item",
        label: "还原项目",
        iconSvg: CONTEXT_MENU_ICONS.restore,
        handler: () => restoreTrashItem(item),
      },
      { type: "divider" },
      {
        type: "item",
        label: "彻底删除 (不可恢复)",
        className: "danger-item",
        iconSvg: CONTEXT_MENU_ICONS.trash,
        handler: () => permanentDeleteTrashItem(item),
      },
    ];
  }

  // Normal mode
  if (isMultiSelect) {
    const count = state.selectedPaths.size;
    const allStarred = Array.from(state.selectedPaths).every((p) => {
      const found = state.items.find((it) => it.path === p);
      return Boolean(found && found.starred);
    });

    return [
      { type: "header", label: `已选择 ${count} 项` },
      {
        type: "item",
        label: `批量下载 (${count}项)`,
        iconSvg: CONTEXT_MENU_ICONS.download,
        handler: bulkDownloadSelected,
      },
      {
        type: "item",
        label: `批量分享 (${count}项)`,
        iconSvg: CONTEXT_MENU_ICONS.share,
        handler: bulkShareSelected,
      },
      {
        type: "item",
        label: "批量复制",
        iconSvg: CONTEXT_MENU_ICONS.copy,
        handler: bulkCopySelected,
      },
      {
        type: "item",
        label: "批量移动",
        iconSvg: CONTEXT_MENU_ICONS.move,
        handler: openBulkMoveModal,
      },
      {
        type: "item",
        label: allStarred ? "批量取消星标" : "批量设为星标",
        iconSvg: allStarred ? CONTEXT_MENU_ICONS.starEmpty : CONTEXT_MENU_ICONS.starFilled,
        handler: bulkStarSelected,
      },
      { type: "divider" },
      {
        type: "item",
        label: `批量删除 (${count}项)`,
        className: "danger-item",
        iconSvg: CONTEXT_MENU_ICONS.trash,
        handler: bulkDeleteSelected,
      },
    ];
  }

  // Single Item Normal Mode
  const isFolder = item.type === "folder" || item.isDirectory;
  const isZip = !isFolder && fileExt(item.name) === "zip";
  const canSummarize = !isFolder && canSummarizeFile(item.name);

  const items = [];

  // 1. 打开/浏览/预览
  items.push({
    type: "item",
    label: isFolder ? "打开文件夹" : (isZip ? "浏览压缩包" : "预览文件"),
    iconSvg: isFolder ? CONTEXT_MENU_ICONS.folderOpen : (isZip ? CONTEXT_MENU_ICONS.archive : CONTEXT_MENU_ICONS.open),
    handler: () => executeOpenItem(item),
  });

  // 2. AI 智能功能
  if (canSummarize) {
    items.push({
      type: "item",
      label: "AI 一键智能总结",
      className: "ai-summary-item",
      iconSvg: CONTEXT_MENU_ICONS.sparkle,
      handler: () => openAiDocSummaryModal(item),
    });
  }

  if (state.aiModeEnabled) {
    items.push({
      type: "item",
      label: "AI 智能对话",
      iconSvg: CONTEXT_MENU_ICONS.aiChat,
      handler: () => openAiChatPlaceholder(item),
    });
  }

  items.push({ type: "divider" });

  // 3. 文件/文件夹基础操作
  items.push({
    type: "item",
    label: isFolder ? "下载文件夹 (ZIP)" : "下载文件",
    iconSvg: CONTEXT_MENU_ICONS.download,
    handler: () => downloadFile(item),
  });

  items.push({
    type: "item",
    label: "公开分享",
    iconSvg: CONTEXT_MENU_ICONS.share,
    handler: () => openShareModal(item),
  });

  items.push({
    type: "item",
    label: item.starred ? "取消星标" : "设为星标",
    iconSvg: item.starred ? CONTEXT_MENU_ICONS.starEmpty : CONTEXT_MENU_ICONS.starFilled,
    handler: () => toggleStarItem(item),
  });

  if (isFolder) {
    const isLocked = Boolean(item.locked);
    items.push({
      type: "item",
      label: isLocked ? "修改文件夹密码 / 密码管理" : "加密文件夹",
      iconSvg: isLocked ? CONTEXT_MENU_ICONS.lockClosed : CONTEXT_MENU_ICONS.lockOpen,
      handler: async () => {
        await runAction(() => openFolderPasswordSettings(item));
      },
    });
  }

  items.push({ type: "divider" });

  // 4. 重命名、复制、移动
  items.push({
    type: "item",
    label: "重命名",
    iconSvg: CONTEXT_MENU_ICONS.pencil,
    handler: () => renameItem(item),
  });

  items.push({
    type: "item",
    label: "复制到...",
    iconSvg: CONTEXT_MENU_ICONS.copy,
    handler: () => copyItem(item),
  });

  items.push({
    type: "item",
    label: "移动到...",
    iconSvg: CONTEXT_MENU_ICONS.move,
    handler: () => moveItem(item),
  });

  items.push({ type: "divider" });

  // 5. 删除
  items.push({
    type: "item",
    label: "删除",
    className: "danger-item",
    iconSvg: CONTEXT_MENU_ICONS.trash,
    handler: () => deleteItem(item),
  });

  return items;
}

function renderContextMenuDom(menu, items) {
  menu.innerHTML = "";
  const frag = document.createDocumentFragment();
  for (const entry of items) {
    if (entry.type === "header") {
      const header = document.createElement("div");
      header.className = "context-menu-header";
      header.textContent = entry.label;
      frag.appendChild(header);
    } else if (entry.type === "divider") {
      const divider = document.createElement("div");
      divider.className = "context-menu-divider";
      frag.appendChild(divider);
    } else {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `context-menu-item ${entry.className || ""}`.trim();
      btn.setAttribute("role", "menuitem");

      const iconSpan = document.createElement("span");
      iconSpan.className = "context-menu-icon";
      iconSpan.innerHTML = entry.iconSvg || "";

      const labelSpan = document.createElement("span");
      labelSpan.className = "context-menu-label";
      labelSpan.textContent = entry.label;

      btn.append(iconSpan, labelSpan);
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        closeContextMenu();
        if (typeof entry.handler === "function") {
          try {
            await entry.handler();
          } catch (err) {
            console.error("Context menu action failed:", err);
          }
        }
      });
      frag.appendChild(btn);
    }
  }
  menu.appendChild(frag);
}

function positionContextMenu(menu, x, y) {
  menu.classList.remove("hidden");
  menu.setAttribute("aria-hidden", "false");
  menu.style.visibility = "hidden";
  menu.style.left = "0px";
  menu.style.top = "0px";

  const rect = menu.getBoundingClientRect();
  const menuWidth = rect.width || 200;
  const menuHeight = rect.height || 320;
  const winWidth = window.innerWidth;
  const winHeight = window.innerHeight;
  const margin = 10;

  let finalX = x;
  let finalY = y;

  // 水平防溢出：靠近右边界时向左翻转
  if (x + menuWidth > winWidth - margin) {
    finalX = x - menuWidth;
    if (finalX < margin) {
      finalX = Math.max(margin, winWidth - menuWidth - margin);
    }
  } else {
    finalX = Math.max(margin, x);
  }

  // 垂直防溢出：靠近底边界时向上翻转
  if (y + menuHeight > winHeight - margin) {
    finalY = y - menuHeight;
    if (finalY < margin) {
      finalY = Math.max(margin, winHeight - menuHeight - margin);
    }
  } else {
    finalY = Math.max(margin, y);
  }

  menu.style.left = `${Math.round(finalX)}px`;
  menu.style.top = `${Math.round(finalY)}px`;
  menu.style.visibility = "visible";
}

function handleOutsidePointerDown(event) {
  const menu = document.getElementById("customContextMenu");
  if (menu && !menu.contains(event.target)) {
    closeContextMenu();
  }
}

function handleContextScrollDismiss() {
  closeContextMenu();
}

function handleContextKeyDown(event) {
  if (event.key === "Escape") {
    event.preventDefault();
    event.stopPropagation();
    closeContextMenu();
  }
}

function bindContextMenuDismissListeners() {
  if (contextMenuDismissBound) return;
  contextMenuDismissBound = true;
  document.addEventListener("pointerdown", handleOutsidePointerDown, true);
  window.addEventListener("wheel", handleContextScrollDismiss, { passive: true });
  window.addEventListener("scroll", handleContextScrollDismiss, { capture: true, passive: true });
  window.addEventListener("resize", handleContextScrollDismiss, { passive: true });
  window.addEventListener("keydown", handleContextKeyDown, true);
}

function unbindContextMenuDismissListeners() {
  if (!contextMenuDismissBound) return;
  contextMenuDismissBound = false;
  document.removeEventListener("pointerdown", handleOutsidePointerDown, true);
  window.removeEventListener("wheel", handleContextScrollDismiss, { passive: true });
  window.removeEventListener("scroll", handleContextScrollDismiss, { capture: true, passive: true });
  window.removeEventListener("resize", handleContextScrollDismiss, { passive: true });
  window.removeEventListener("keydown", handleContextKeyDown, true);
}

function closeContextMenu() {
  const menu = document.getElementById("customContextMenu");
  if (menu && !menu.classList.contains("hidden")) {
    menu.classList.add("hidden");
    menu.setAttribute("aria-hidden", "true");
    menu.innerHTML = "";
  }
  if (activeContextMenuRow) {
    activeContextMenuRow.classList.remove("context-active-row");
    activeContextMenuRow = null;
  }
  unbindContextMenuDismissListeners();
}

function handleRowContextMenu(event, tr) {
  if (document.querySelector(".modal:not(.hidden)")) return;

  const itemKey = tr.dataset.path;
  if (!itemKey) return;

  const item = state.items.find((entry) => (entry.path || entry.id || entry.trashId) === itemKey);
  if (!item) return;

  const isMultiSelect = state.selectedPaths.size > 1 && state.selectedPaths.has(itemKey);

  if (!isMultiSelect) {
    if (state.selectedPaths.size > 0 && !state.selectedPaths.has(itemKey)) {
      clearSelection();
    }
  }

  if (activeContextMenuRow && activeContextMenuRow !== tr) {
    activeContextMenuRow.classList.remove("context-active-row");
  }
  activeContextMenuRow = tr;
  tr.classList.add("context-active-row");

  const menuItems = buildContextMenuItems(item, isMultiSelect);
  if (!menuItems || menuItems.length === 0) return;

  const menu = getOrCreateContextMenuElement();
  renderContextMenuDom(menu, menuItems);
  positionContextMenu(menu, event.clientX, event.clientY);
  bindContextMenuDismissListeners();
}

function applyFolderData(data, options = {}) {
  state.searchActive = false;
  state.searchQuery = "";
  state.searchRawItems = [];
  state.searchCategory = "all";
  state.searchSort = searchSort?.value || "relevance";
  state.searchTokens = [];

  const pathChanged = state.path !== data.path;
  if (pathChanged) {
    state.lastAnchorKey = "";
  }
  if (pathChanged && aiDrawer && !aiDrawer.classList.contains("hidden") && state.aiDrawer.mode === "global") {
    archiveCurrentAiSession();
    saveAiConversation();
  }

  const itemsIdentical = !pathChanged && areFolderItemsEqual(state.items, data.items);
  if (itemsIdentical && options.silent) {
    storageRoot.textContent = compactStoragePath(data.storageRoot);
    storageRoot.title = data.storageRoot;
    scheduleStorageUsageRefresh();
    return;
  }

  state.path = data.path;
  state.items = data.items;
  for (const item of state.items) {
    if (item.type !== "folder" || !item.locked) continue;
    if (item.unlocked) state.unlockedFolders.add(item.path);
    else state.unlockedFolders.delete(item.path);
  }
  syncAiResultCardsWithFolderState();
  if (clearSearchBtn) clearSearchBtn.classList.add("hidden");
  if (searchTools) searchTools.classList.add("hidden");
  if (searchCategoryTabs) searchCategoryTabs.innerHTML = "";
  if (searchSummary) {
    searchSummary.classList.add("hidden");
    searchSummary.textContent = "";
  }
  const visiblePaths = new Set(state.items.map((item) => item.path));
  for (const selectedPath of [...state.selectedPaths]) {
    if (!visiblePaths.has(selectedPath)) state.selectedPaths.delete(selectedPath);
  }
  if (!state.selectedPaths.size) state.selectionMode = false;
  storageRoot.textContent = compactStoragePath(data.storageRoot);
  storageRoot.title = data.storageRoot;
  if (currentFolderLabel) currentFolderLabel.textContent = displayFolder(state.path);
  updateSearchScopeLabel();
  syncAiGlobalBtnUi();
  backBtn.disabled = !state.path;
  renderBreadcrumb();
  updateSelectionUi();
  const shouldAnimateAi = Boolean(state.aiModeEnabled && (options.animateAi ?? (pathChanged && !options.noAnimation && !options.silent)));
  renderRows({ noAnimation: options.noAnimation, animateAi: shouldAnimateAi });
  scheduleStorageUsageRefresh();
  if (aiDrawer && !aiDrawer.classList.contains("hidden")) {
    if (!isAiGenerating) {
      if (state.aiDrawer.mode === "global" && pathChanged) {
        state.aiDrawer.forceGlobal = false;
        state.aiDrawer.key = aiConversationKey("global", null, state.path);
        syncCurrentAiSessionScope();
        state.aiDrawer.messages = loadAiConversation("global", null, state.aiDrawer.key);
        renderAiDrawer();
      }
      if (aiHistoryPanel && !aiHistoryPanel.classList.contains("hidden")) {
        renderAiHistoryPanel();
      }
    }
  }
  if (!options.silent) setStatus(`已加载 ${state.items.length} 个项目，上传将保存到当前目录。`);
  if (!options.skipHistory) updateLocation(state.path, options.replaceHistory);
}

async function loadFolder(path = state.path, options = {}) {
  if (state.trashMode) {
    if (options.silent || options.preserveTrash) {
      return loadTrash(options);
    }
    exitTrashMode();
  } else {
    const lingeringTrashBtn = document.getElementById("trashClearBtn");
    if (lingeringTrashBtn) lingeringTrashBtn.remove();
  }
  if (state.starredMode) {
    if (options.silent || options.preserveStarred) {
      return loadStarred(options);
    }
    exitStarredMode();
  }
  const cached = !options.forceRefresh ? getCachedFolder(path) : null;
  let cachedRendered = false;
  if (cached) {
    cachedRendered = true;
    const animateFromCache = Boolean(state.aiModeEnabled && !options.noAnimation && !options.silent);
    applyFolderData(cached, { ...options, silent: true, noAnimation: !animateFromCache, animateAi: animateFromCache });
    if (!options.silent) setStatus("正在加载目录内容...");
  }
  const requestSeq = ++state.folderLoadRequestSeq;
  state.folderLoadController?.abort();
  const controller = new AbortController();
  state.folderLoadController = controller;
  let data;
  try {
    data = await api(`/api/list?path=${encodeURIComponent(path)}`, { signal: controller.signal });
  } catch (error) {
    if (isAbortError(error) || controller.signal.aborted) return;
    if (error.code === "FOLDER_LOCKED" && error.folderPath) {
      const ok = await unlockFolder(error.folderPath, displayFolder(error.folderPath));
      if (!ok) return;
      if (requestSeq !== state.folderLoadRequestSeq || controller.signal.aborted) return;
      data = await api(`/api/list?path=${encodeURIComponent(path)}`, { signal: controller.signal });
    } else {
      if (!options.silent) {
        setStatus(friendlyErrorMessage(error, "目录加载失败，请检查网络或刷新重试"));
      }
      throw error;
    }
  }
  if (requestSeq !== state.folderLoadRequestSeq || controller.signal.aborted) return;
  setCachedFolder(data);
  if (cachedRendered) {
    applyFolderData(data, { ...options, noAnimation: true, animateAi: false });
  } else {
    applyFolderData(data, options);
  }
  if (state.folderLoadController === controller) state.folderLoadController = null;
}

function applySearchData(data) {
  state.searchActive = true;
  state.searchQuery = data.query || "";
  state.searchRawItems = data.results || [];
  state.searchCategory = "all";
  state.searchSort = searchSort?.value || "relevance";
  state.searchTokens = data.tokens?.length ? data.tokens : localSearchTokens(state.searchQuery);
  state.items = [];
  state.selectedPaths.clear();
  state.selectionMode = false;
  updateSearchVisibleItems();
  updateSearchScopeLabel();
  if (currentFolderLabel) currentFolderLabel.textContent = `搜索：${state.searchQuery}`;
  backBtn.disabled = !state.path;
  renderRows({ noAnimation: true });
  if (aiDrawer && !aiDrawer.classList.contains("hidden")) renderAiDrawer();
  if (clearSearchBtn) clearSearchBtn.classList.remove("hidden");
  if (searchTools) searchTools.classList.remove("hidden");
  if (searchSummary) {
    const scopeText = `当前目录：${displayFolder(data.path || "")}`;
    const limitText = data.truncated ? "，结果较多已截断" : "";
    searchSummary.textContent = `找到 ${state.searchRawItems.length} 项，当前显示 ${state.items.length} 项，扫描 ${data.scanned} 个条目，范围：${scopeText}${limitText}`;
    searchSummary.classList.remove("hidden");
  }
  setStatus(searchSummary?.textContent || `搜索完成：找到 ${state.searchRawItems.length} 项`);
}

async function performSearch() {
  exitTrashMode();
  exitStarredMode();
  const query = searchInput?.value.trim() || "";
  if (!query) {
    setStatus("请输入搜索关键词，可以搜文件名、文件夹名、路径、类型、日期或大小。");
    searchInput?.focus();
    return;
  }
  setStatus("正在搜索...本次搜索只会主动扫描一次当前账号目录。");
  const params = new URLSearchParams({
    q: query,
    path: state.path || "",
  });
  try {
    const data = await api(`/api/search?${params.toString()}`, { cache: "no-store" });
    applySearchData(data);
  } catch (error) {
    await showErrorDialog(error.message);
    setStatus(error.message);
  }
}

async function clearSearch() {
  state.searchActive = false;
  state.searchQuery = "";
  state.searchRawItems = [];
  state.searchCategory = "all";
  state.searchTokens = [];
  if (searchInput) searchInput.value = "";
  if (clearSearchBtn) clearSearchBtn.classList.add("hidden");
  if (searchTools) searchTools.classList.add("hidden");
  if (searchCategoryTabs) searchCategoryTabs.innerHTML = "";
  if (searchSummary) {
    searchSummary.classList.add("hidden");
    searchSummary.textContent = "";
  }
  await loadFolder(state.path, { replaceHistory: true, forceRefresh: true, noAnimation: true });
}

async function refreshCurrentFolder() {
  if (driveView.classList.contains("hidden")) return;
  void refreshStarredCount();
  if (state.trashMode) {
    if (Date.now() < state.realtimeRefreshSuppressUntil) return;
    if (isUiInteractionActive()) {
      state.pendingRealtimeRefresh = true;
      return;
    }
    try {
      await loadTrash({ silent: true });
    } catch {}
    return;
  }
  if (state.starredMode) {
    if (Date.now() < state.realtimeRefreshSuppressUntil) return;
    if (isUiInteractionActive()) {
      state.pendingRealtimeRefresh = true;
      return;
    }
    try {
      await loadStarred({ silent: true });
    } catch {}
    return;
  }
  if (state.searchActive) return;
  if (Date.now() < state.realtimeRefreshSuppressUntil) return;
  if (isUiInteractionActive()) {
    state.pendingRealtimeRefresh = true;
    return;
  }
  try {
    clearFolderCaches(state.path);
    await loadFolder(state.path, { replaceHistory: true, silent: true, forceRefresh: true, noAnimation: true });
  } catch {}
}

function scheduleRealtimeRefresh() {
  if (Date.now() < state.realtimeRefreshSuppressUntil) return;
  clearTimeout(state.refreshTimer);
  state.refreshTimer = window.setTimeout(() => {
    state.refreshTimer = null;
    if (Date.now() < state.realtimeRefreshSuppressUntil) return;
    if (isUiInteractionActive()) {
      state.pendingRealtimeRefresh = true;
      return;
    }
    refreshCurrentFolder();
  }, 700);
}

function startRealtimeRefresh() {
  if (state.eventSource) state.eventSource.close();
  state.eventSource = new EventSource(authUrl("/api/events"));
  state.eventSource.onmessage = (event) => {
    try {
      const data = event.data ? JSON.parse(event.data) : null;
      if (data?.type === "avatar-change") {
        state.avatarVersion = data.at || Date.now();
        api("/api/me").then((me) => {
          if (me?.user) {
            state.currentUser = me.user;
            syncAdminUi();
          }
        }).catch(() => {});
        return;
      }
    } catch {}
    scheduleRealtimeRefresh();
  };
  state.eventSource.onerror = () => {
    state.eventSource?.close();
    window.setTimeout(() => {
      if (!driveView.classList.contains("hidden")) startRealtimeRefresh();
    }, 1500);
  };
}

async function runAction(fn) {
  try {
    state.busy = true;
    setStatus("正在处理...");
    await fn();
    clearFolderCaches();
    suppressNextRealtimeRefresh();
    if (state.starredMode) {
      await loadStarred({ silent: true });
    } else {
      await loadFolder(state.path, { replaceHistory: true, forceRefresh: true });
    }
    refreshStarredCount();
    scheduleStorageUsageRefresh({ force: true });
  } catch (error) {
    await showErrorDialog(error.message);
    setStatus(error.message);
  } finally {
    state.busy = false;
    void flushPendingRealtimeRefresh();
  }
}

async function moveItemToFolder(source, targetDir) {
  try {
    state.busy = true;
    setStatus("正在移动...");
    await api("/api/move", {
      method: "POST",
      body: JSON.stringify({ source, targetDir }),
    });
    clearFolderCaches();
    suppressNextRealtimeRefresh();
    await loadFolder(state.path, { replaceHistory: true, forceRefresh: true });
    setStatus(`已移动到“${displayFolder(targetDir)}”`);
  } catch (error) {
    await showErrorDialog(error.message);
    setStatus(error.message);
  } finally {
    state.busy = false;
    void flushPendingRealtimeRefresh();
  }
}

async function openBulkMoveModal() {
  if (!state.selectedPaths.size) return;
  try {
    state.busy = true;
    const data = await getFolderList();
    const selected = new Set(state.selectedPaths);
    bulkMoveFolderSelect.innerHTML = "";
    for (const folder of data.folders) {
      if (selected.has(folder.path)) continue;
      const option = document.createElement("option");
      option.value = folder.path;
      option.textContent = folderOptionLabel(folder);
      bulkMoveFolderSelect.append(option);
    }
    bulkMoveFolderSelect.value = [...bulkMoveFolderSelect.options].some((option) => option.value === state.path)
      ? state.path
      : "";
    syncFolderDropdown(bulkMoveFolderSelect);
    bulkMoveModal.classList.remove("hidden");
    bulkMoveModal.setAttribute("aria-hidden", "false");
  } catch (error) {
    await showErrorDialog(error.message);
  } finally {
    state.busy = false;
    void flushPendingRealtimeRefresh();
  }
}

function closeBulkMoveModal() {
  closeFolderDropdown(bulkMoveFolderSelect);
  bulkMoveModal.classList.add("hidden");
  bulkMoveModal.setAttribute("aria-hidden", "true");
  void flushPendingRealtimeRefresh();
}

async function bulkMoveSelected() {
  const items = selectedItems();
  const targetDir = bulkMoveFolderSelect.value;
  if (!items.length) return;
  await runAction(async () => {
    for (const item of items) {
      await api("/api/move", {
        method: "POST",
        body: JSON.stringify({ source: item.path, targetDir }),
      });
    }
  });
  closeBulkMoveModal();
  clearSelection();
  setStatus(`已移动 ${items.length} 项`);
}

async function bulkCopySelected() {
  const items = selectedItems();
  if (!items.length) return;
  const data = await getFolderList();
  const selectedFolderPaths = items.filter((item) => item.type === "folder").map((item) => item.path);
  const options = folderSelectOptions(data.folders, {
    excludePaths: selectedFolderPaths,
  }).filter((option) => !selectedFolderPaths.some((folderPath) => folderIsInside(option.value, folderPath)));
  const result = await openDialog({
    eyebrow: "复制",
    title: "复制选中项目",
    description: `请选择要把选中的 ${items.length} 项复制进去的目标文件夹。`,
    select: {
      label: "目标文件夹",
      value: state.path,
      options,
    },
    validate(first, second, selected) {
      if (!options.some((option) => option.value === selected)) return "请选择有效的目标文件夹";
      return "";
    },
  });
  if (result === null) return;
  const targetDir = result.selectedValue;
  await runAction(async () => {
    for (const item of items) {
      await api("/api/copy", {
        method: "POST",
        body: JSON.stringify({ source: item.path, targetDir }),
      });
    }
  });
  clearSelection();
  setStatus(`已复制 ${items.length} 项`);
}

async function bulkDownloadSelected() {
  const items = selectedItems();
  if (!items.length) return;
  const folderPasswords = {};
  try {
    setStatus("正在准备下载...");
    const data = await resolveBulkDownloadLink(items, folderPasswords);
    startBrowserDownload(data.url);
    setStatus(`正在下载 ${items.length} 项`);
  } catch (error) {
    if (error.canceled) return;
    if (error.code === "FOLDER_LOCKED" && error.folderPath) {
      const ok = await unlockFolder(error.folderPath, displayFolder(error.folderPath));
      if (ok) return bulkDownloadSelected();
      return;
    }
    await showErrorDialog(error.message);
    setStatus(error.message);
  }
}

function bulkShareSelected() {
  const items = selectedItems();
  if (!items || !items.length) return;
  openShareModal(items);
}

async function resolveBulkDownloadLink(items, folderPasswords = {}) {
  while (true) {
    try {
      return await requestBulkDownloadLink(items, folderPasswords);
    } catch (error) {
      if (error.code !== "FOLDER_DOWNLOAD_LOCKED" || !error.folderPath) throw error;
      const password = await promptDownloadPassword(error.folderPath);
      if (password === null) throw Object.assign(new Error("已取消下载"), { canceled: true });
      folderPasswords[error.folderPath] = password;
    }
  }
}

function requestBulkDownloadLink(items, folderPasswords = {}) {
  return api("/api/bulk-download-link", {
    method: "POST",
    body: JSON.stringify({
      paths: items.map((item) => item.path),
      folderPasswords,
    }),
  });
}

function startBrowserDownload(url) {
  const link = document.createElement("a");
  link.href = url;
  link.rel = "noopener";
  link.style.display = "none";
  document.body.append(link);
  link.click();
  link.remove();
}

async function bulkDeleteSelected() {
  const items = selectedItems();
  if (!items.length) return;
  const ok = await showConfirmDialog("删除选中项目", `确认删除选中的 ${items.length} 项吗？`);
  if (!ok) return;
  await runAction(async () => {
    for (const item of items) {
      let body = { path: item.path };
      if (item.type === "folder" && item.locked) {
        const verified = await verifyFolderDeletion(item);
        if (!verified) throw new Error(`已取消删除“${itemName(item)}”`);
        body = {
          path: item.path,
          adminPassword: verified.adminPassword,
          currentPassword: verified.currentPassword,
        };
      }
      await api("/api/item", {
        method: "DELETE",
        body: JSON.stringify(body),
      });
    }
  });
  clearSelection();
  setStatus(`已删除 ${items.length} 项`);
}

async function populateUploadFolders(defaultPath = state.path) {
  const data = await getFolderList();
  uploadFolderSelect.innerHTML = "";
  for (const folder of data.folders) {
    const option = document.createElement("option");
    option.value = folder.path;
    option.textContent = folderOptionLabel(folder);
    uploadFolderSelect.append(option);
  }
  uploadFolderSelect.value = [...uploadFolderSelect.options].some((option) => option.value === defaultPath)
    ? defaultPath
    : "";
  syncFolderDropdown(uploadFolderSelect);
}

async function openUploadModal() {
  try {
    state.busy = true;
    await populateUploadFolders(state.path);
    uploadModal.classList.remove("hidden");
    uploadModal.setAttribute("aria-hidden", "false");
  } catch (error) {
    await showErrorDialog(error.message);
  } finally {
    state.busy = false;
  }
}

function closeUploadModal() {
  closeFolderDropdown(uploadFolderSelect);
  uploadModal.classList.add("hidden");
  uploadModal.setAttribute("aria-hidden", "true");
  void flushPendingRealtimeRefresh();
}

function fileRelativePath(file) {
  return file.webkitRelativePath || file.relativePath || file.name;
}

function promptUploadConflicts(conflicts) {
  return new Promise((resolve) => {
    if (!conflicts || !conflicts.length || !uploadConflictModal) {
      resolve({});
      return;
    }

    const totalCount = conflicts.length;
    let currentIndex = 0;
    const decisions = {};

    if (totalCount > 1) {
      if (conflictEyebrow) conflictEyebrow.textContent = `批量冲突检测 (${totalCount} 项)`;
      if (conflictModalTitle) conflictModalTitle.textContent = `检测到 ${totalCount} 个同名文件冲突`;
      conflictMultiBanner?.classList.remove("hidden");
      conflictApplyAllWrap?.classList.remove("hidden");
      if (conflictApplyAllText) conflictApplyAllText.textContent = `为全部 ${totalCount} 个冲突文件应用此操作`;
      if (conflictApplyAllCheck) conflictApplyAllCheck.checked = true;
    } else {
      if (conflictEyebrow) conflictEyebrow.textContent = "上传文件冲突检测";
      if (conflictModalTitle) conflictModalTitle.textContent = "目标位置已包含同名文件";
      conflictMultiBanner?.classList.add("hidden");
      conflictApplyAllWrap?.classList.add("hidden");
    }

    function updateActionCardLabels() {
      const item = conflicts[currentIndex];
      const isMulti = totalCount > 1;
      const applyAll = isMulti && conflictApplyAllCheck && conflictApplyAllCheck.checked;

      if (applyAll) {
        if (conflictReplaceTitle) conflictReplaceTitle.textContent = `全部替换 (${totalCount} 个文件)`;
        if (conflictReplaceDesc) conflictReplaceDesc.textContent = `用准备上传的 ${totalCount} 个新文件覆盖网盘已有同名文件，不产生多余副本`;

        if (conflictKeepBothTitle) conflictKeepBothTitle.textContent = `全部保留两者 (${totalCount} 个文件)`;
        if (conflictKeepBothDesc) conflictKeepBothDesc.textContent = `所有新文件自动添加编号如 (1)，与网盘原文件共同保留`;

        if (conflictSkipTitle) conflictSkipTitle.textContent = `全部跳过 (${totalCount} 个文件)`;
        if (conflictSkipDesc) conflictSkipDesc.textContent = `不上传这 ${totalCount} 个冲突文件，网盘已有文件保持不变`;
      } else if (isMulti) {
        if (conflictReplaceTitle) conflictReplaceTitle.textContent = "仅替换当前文件";
        if (conflictReplaceDesc) conflictReplaceDesc.textContent = `用当前上传文件覆盖网盘中的“${item?.name || "原文件"}”`;

        if (conflictKeepBothTitle) conflictKeepBothTitle.textContent = "仅保留当前两者";
        if (conflictKeepBothDesc) conflictKeepBothDesc.textContent = `当前新文件自动重命名为：“${item?.suggestedKeepBothName || item?.name || "新文件 (1)"}”，两者共同保留`;

        if (conflictSkipTitle) conflictSkipTitle.textContent = "仅跳过当前文件";
        if (conflictSkipDesc) conflictSkipDesc.textContent = `不上传当前文件，网盘中原有文件保持不变`;
      } else {
        if (conflictReplaceTitle) conflictReplaceTitle.textContent = "替换目标中的文件";
        if (conflictReplaceDesc) conflictReplaceDesc.textContent = "用正在上传的新文件覆盖现有文件，保留原文件名，不产生多余副本";

        if (conflictKeepBothTitle) conflictKeepBothTitle.textContent = "同时保留两个文件";
        if (conflictKeepBothDesc) conflictKeepBothDesc.textContent = `新文件将自动重命名为：“${item?.suggestedKeepBothName || item?.name || "新文件 (1)"}”，两者共同保留`;

        if (conflictSkipTitle) conflictSkipTitle.textContent = "跳过此文件";
        if (conflictSkipDesc) conflictSkipDesc.textContent = "不上传该文件，目标文件夹中的原有文件保持不变";
      }
    }

    function renderCurrentConflict() {
      if (currentIndex >= conflicts.length) {
        closeModal();
        resolve(decisions);
        return;
      }

      const item = conflicts[currentIndex];

      if (totalCount > 1) {
        if (conflictCurrentFileName) conflictCurrentFileName.textContent = `“${item.relativePath || item.name}”`;
        if (conflictMultiCounter) conflictMultiCounter.textContent = `冲突项目 ${currentIndex + 1} / ${totalCount}`;
        if (conflictMultiPath) {
          conflictMultiPath.textContent = item.relativePath || item.name;
          conflictMultiPath.title = item.relativePath || item.name;
        }
        if (conflictPrevBtn) conflictPrevBtn.disabled = currentIndex === 0;
        if (conflictNextBtn) conflictNextBtn.disabled = currentIndex === totalCount - 1;
      } else {
        if (conflictCurrentFileName) conflictCurrentFileName.textContent = `“${item.name}”`;
      }

      if (conflictExistingName) {
        conflictExistingName.textContent = item.existing.name;
        conflictExistingName.title = item.existing.name;
      }
      if (conflictExistingSize) conflictExistingSize.textContent = formatSize(item.existing.size);
      if (conflictExistingMtime) conflictExistingMtime.textContent = formatTime(item.existing.mtime);

      if (conflictIncomingName) {
        conflictIncomingName.textContent = item.incoming.name;
        conflictIncomingName.title = item.incoming.name;
      }
      if (conflictIncomingSize) conflictIncomingSize.textContent = formatSize(item.incoming.size);
      if (conflictIncomingMtime) conflictIncomingMtime.textContent = formatTime(item.incoming.mtime);

      const existingMeta = fileMeta({ name: item.existing.name });
      const incomingMeta = fileMeta({ name: item.incoming.name });
      if (conflictExistingIcon) conflictExistingIcon.textContent = existingMeta.label || "📄";
      if (conflictIncomingIcon) conflictIncomingIcon.textContent = incomingMeta.label || "📄";

      updateActionCardLabels();
    }

    function handleAction(action) {
      const applyAll = totalCount > 1 && conflictApplyAllCheck && conflictApplyAllCheck.checked;
      if (applyAll) {
        for (let i = 0; i < conflicts.length; i++) {
          const c = conflicts[i];
          decisions[c.relativePath] = action;
          decisions[c.name] = action;
        }
        closeModal();
        resolve(decisions);
        return;
      }

      const c = conflicts[currentIndex];
      decisions[c.relativePath] = action;
      decisions[c.name] = action;

      if (currentIndex < conflicts.length - 1) {
        currentIndex += 1;
        renderCurrentConflict();
      } else {
        closeModal();
        resolve(decisions);
      }
    }

    function closeModal() {
      uploadConflictModal.classList.add("hidden");
      uploadConflictModal.setAttribute("aria-hidden", "true");
      cleanup();
    }

    function cancelAll() {
      closeModal();
      resolve(null);
    }

    const onReplace = () => handleAction("replace");
    const onKeepBoth = () => handleAction("keep_both");
    const onSkip = () => handleAction("skip");
    const onCancel = () => cancelAll();
    const onPrev = () => {
      if (currentIndex > 0) {
        currentIndex -= 1;
        renderCurrentConflict();
      }
    };
    const onNext = () => {
      if (currentIndex < totalCount - 1) {
        currentIndex += 1;
        renderCurrentConflict();
      }
    };
    const onApplyAllChange = () => updateActionCardLabels();

    function cleanup() {
      conflictReplaceBtn?.removeEventListener("click", onReplace);
      conflictKeepBothBtn?.removeEventListener("click", onKeepBoth);
      conflictSkipBtn?.removeEventListener("click", onSkip);
      cancelConflictUploadBtn?.removeEventListener("click", onCancel);
      closeConflictModalBtn?.removeEventListener("click", onCancel);
      conflictPrevBtn?.removeEventListener("click", onPrev);
      conflictNextBtn?.removeEventListener("click", onNext);
      conflictApplyAllCheck?.removeEventListener("change", onApplyAllChange);
    }

    conflictReplaceBtn?.addEventListener("click", onReplace);
    conflictKeepBothBtn?.addEventListener("click", onKeepBoth);
    conflictSkipBtn?.addEventListener("click", onSkip);
    cancelConflictUploadBtn?.addEventListener("click", onCancel);
    closeConflictModalBtn?.addEventListener("click", onCancel);
    conflictPrevBtn?.addEventListener("click", onPrev);
    conflictNextBtn?.addEventListener("click", onNext);
    conflictApplyAllCheck?.addEventListener("change", onApplyAllChange);

    uploadConflictModal.classList.remove("hidden");
    uploadConflictModal.setAttribute("aria-hidden", "false");
    renderCurrentConflict();
  });
}

async function uploadFiles(files, targetPath = state.path) {
  if (!files.length) return;
  const filtered = filterUploadFiles(files);
  files = filtered.files;
  if (!files.length) {
    setStatus("未找到可上传的文件，已自动跳过临时文件与系统文件。");
    return;
  }

  // Windows 风格冲突预检
  let conflictDecisions = {};
  try {
    const checkRes = await api("/api/upload-check-conflicts", {
      method: "POST",
      body: JSON.stringify({
        targetPath,
        files: files.map((f) => ({
          name: f.name,
          relativePath: fileRelativePath(f),
          size: f.size,
          mtime: f.lastModified || Date.now(),
        })),
      }),
    });
    if (checkRes?.conflicts?.length > 0) {
      const decisions = await promptUploadConflicts(checkRes.conflicts);
      if (!decisions) {
        setStatus("已取消上传。");
        return;
      }
      conflictDecisions = decisions;
    }
  } catch (err) {
    console.warn("冲突预检跳过:", err);
  }

  // 过滤用户选择跳过的文件
  files = files.filter((f) => {
    const rel = fileRelativePath(f);
    return conflictDecisions[rel] !== "skip" && conflictDecisions[f.name] !== "skip";
  });
  if (!files.length) {
    setStatus("已跳过所有同名文件上传。");
    return;
  }

  try {
    state.busy = true;
    state.uploadProgressMax = 0;
    showUploadProgress(0, files.length);
    if (shouldUseChunkUpload(files)) {
      await uploadFilesInChunks(files, targetPath, conflictDecisions);
    } else {
      const form = new FormData();
      for (const file of files) {
        form.append("files", file);
        form.append("relativePaths", fileRelativePath(file));
      }
      form.append("conflictActions", JSON.stringify(conflictDecisions));
      await apiUpload(`/api/upload?path=${encodeURIComponent(targetPath)}`, form, files);
    }
    hideUploadProgressSoon();
    clearFolderCaches();
    suppressNextRealtimeRefresh();
    if (targetPath === state.path) {
      await loadFolder(state.path, { replaceHistory: true, forceRefresh: true });
    } else {
      await loadFolder(state.path, { replaceHistory: true, silent: true, forceRefresh: true });
      setStatus(`上传完成，文件已保存到“${displayFolder(targetPath)}”`);
    }
    scheduleStorageUsageRefresh({ force: true });
  } catch (error) {
    uploadProgress.classList.add("hidden");
    uploadProgressBar.style.width = "0%";
    state.uploadProgressMax = 0;
    await showErrorDialog(error.message);
    setStatus(error.message);
  } finally {
    fileInput.value = "";
    folderInput.value = "";
    state.busy = false;
    void flushPendingRealtimeRefresh();
  }
}

function renderSpreadsheetPreview(data) {
  const wrap = document.createElement("div");
  wrap.className = "spreadsheet-preview";

  const tabs = document.createElement("div");
  tabs.className = "sheet-tabs";
  const tableWrap = document.createElement("div");
  tableWrap.className = "sheet-table-wrap";

  function renderSheet(sheet, index) {
    [...tabs.children].forEach((button, buttonIndex) => {
      button.classList.toggle("active", buttonIndex === index);
    });
    tableWrap.innerHTML = "";

    if (!sheet.rows.length) {
      const empty = document.createElement("div");
      empty.className = "sheet-empty";
      empty.textContent = "这个工作表是空的";
      tableWrap.append(empty);
      return;
    }

    const table = document.createElement("table");
    table.className = "sheet-table";
    const tbody = document.createElement("tbody");
    sheet.rows.forEach((row, rowIndex) => {
      const tr = document.createElement("tr");
      const rowHead = document.createElement(rowIndex === 0 ? "th" : "td");
      rowHead.className = "sheet-row-index";
      rowHead.textContent = rowIndex + 1;
      tr.append(rowHead);
      row.forEach((cell) => {
        const cellEl = document.createElement(rowIndex === 0 ? "th" : "td");
        cellEl.textContent = cell == null ? "" : String(cell);
        tr.append(cellEl);
      });
      tbody.append(tr);
    });
    table.append(tbody);
    tableWrap.append(table);
  }

  data.sheets.forEach((sheet, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = sheet.name;
    button.addEventListener("click", () => renderSheet(sheet, index));
    tabs.append(button);
  });

  if (data.truncated) {
    const note = document.createElement("p");
    note.className = "sheet-note";
    note.textContent = "预览只显示前 100 行、40 列和前 12 个工作表，完整内容请下载查看。";
    wrap.append(note);
  }

  wrap.append(tabs, tableWrap);
  previewBody.append(wrap);
  renderSheet(data.sheets[0] || { rows: [] }, 0);
}

function renderWordPreview(data) {
  const wrap = document.createElement("article");
  wrap.className = "word-preview";
  const rawHtml = data.html || "<p>这个 Word 文档没有可提取的正文。</p>";
  wrap.innerHTML = window.DOMPurify?.sanitize ? window.DOMPurify.sanitize(rawHtml) : rawHtml;
  previewBody.append(wrap);
}

function renderPresentationPreview(data) {
  const wrap = document.createElement("div");
  wrap.className = "presentation-preview";

  if (data.truncated) {
    const note = document.createElement("p");
    note.className = "sheet-note";
    note.textContent = "预览只显示前 80 页幻灯片，完整内容请下载查看。";
    wrap.append(note);
  }

  if (!data.slides.length) {
    const empty = document.createElement("div");
    empty.className = "sheet-empty";
    empty.textContent = "这个 PPT 没有可提取的文字内容。";
    wrap.append(empty);
    previewBody.append(wrap);
    return;
  }

  for (const slide of data.slides) {
    const card = document.createElement("section");
    card.className = "slide-card";
    const title = document.createElement("h3");
    title.textContent = `第 ${slide.number} 页`;
    card.append(title);

    if (slide.texts.length) {
      const list = document.createElement("div");
      list.className = "slide-lines";
      for (const text of slide.texts) {
        const line = document.createElement("p");
        line.textContent = text;
        list.append(line);
      }
      card.append(list);
    } else {
      const empty = document.createElement("p");
      empty.className = "slide-empty";
      empty.textContent = "这一页没有可提取的文字。";
      card.append(empty);
    }

    wrap.append(card);
  }

  previewBody.append(wrap);
}

function renderPreviewFallback(item, title, message) {
  const fallback = document.createElement("div");
  fallback.className = "preview-fallback";

  const strong = document.createElement("strong");
  strong.textContent = title;
  const name = document.createElement("span");
  name.textContent = itemName(item);
  const size = document.createElement("small");
  size.textContent = `Size: ${formatSize(item.size)}`;
  const body = document.createElement("p");
  body.textContent = message;

  fallback.append(strong, name, size, body);
  previewBody.append(fallback);
}

function renderImagePreviewControls(item) {
  const images = currentFolderImages();
  if (images.length < 2) return;
  const currentIndex = images.findIndex((image) => image.path === item.path);
  const controls = [
    { className: "previous", label: "上一张图片", text: "‹", direction: -1 },
    { className: "next", label: "下一张图片", text: "›", direction: 1 },
  ];
  for (const control of controls) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `preview-nav ${control.className}`;
    button.setAttribute("aria-label", control.label);
    button.title = control.label;
    button.textContent = control.text;
    button.addEventListener("click", () => switchImagePreview(control.direction));
    previewCard.append(button);
  }
  const counter = document.createElement("div");
  counter.className = "preview-counter";
  counter.textContent = `${currentIndex + 1} / ${images.length}`;
  previewCard.append(counter);
}

async function openPreview(item) {
  if (fileExt(item.name) === "zip") {
    openZipArchiveModal(item);
    return;
  }
  const url = authUrl(`/api/preview?path=${encodeURIComponent(item.path)}`);
  const kind = previewKind(item.name);
  const requestSeq = ++state.previewRequestSeq;
  state.previewController?.abort();
  const controller = new AbortController();
  state.previewController = controller;

  state.previewItem = item;
  previewTitle.textContent = itemName(item);
  previewDownloadLink.href = "#";
  previewDownloadLink.onclick = (event) => {
    event.preventDefault();
    downloadFile(item);
  };
  previewBody.innerHTML = "";
  clearImagePreviewControls();
  previewModal.classList.remove("hidden");
  previewModal.setAttribute("aria-hidden", "false");

  // AI Document Summarize button toggle
  const canSummarize = canSummarizeFile(item.name);
  if (previewAiSummarizeBtn) {
    if (canSummarize) {
      previewAiSummarizeBtn.classList.remove("hidden");
      previewAiSummarizeBtn.onclick = () => openAiDocSummaryModal(item);
    } else {
      previewAiSummarizeBtn.classList.add("hidden");
    }
  }

  if (kind === "image") {
    const image = document.createElement("img");
    image.src = url;
    image.alt = item.name;
    previewBody.append(image);
    renderImagePreviewControls(item);
  } else if (kind === "video") {
    const video = document.createElement("video");
    video.src = url;
    video.controls = true;
    video.autoplay = false;
    previewBody.append(video);
  } else if (kind === "audio") {
    const audioWrap = document.createElement("div");
    audioWrap.className = "audio-preview";
    const audio = document.createElement("audio");
    audio.src = url;
    audio.controls = true;
    audioWrap.append(audio);
    previewBody.append(audioWrap);
  } else if (kind === "pdf") {
    const iframe = document.createElement("iframe");
    iframe.src = url;
    iframe.title = item.name;
    iframe.addEventListener("load", () => {
      const loading = previewBody.querySelector(".sheet-empty");
      if (loading) loading.remove();
    });
    previewBody.append(iframe);
  } else if (kind === "office") {
    const loading = document.createElement("div");
    loading.className = "sheet-empty";
    loading.textContent = "Loading Office preview...";
    previewBody.append(loading);
    try {
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) {
        let message = "Preview failed.";
        try {
          const data = await response.json();
          message = data.error || message;
        } catch {}
        throw new Error(message);
      }
      if (requestSeq !== state.previewRequestSeq || controller.signal.aborted) return;
      previewBody.innerHTML = "";
      const blobUrl = URL.createObjectURL(await response.blob());
      const iframe = document.createElement("iframe");
      iframe.src = blobUrl;
      iframe.title = item.name;
      iframe.addEventListener("load", () => URL.revokeObjectURL(blobUrl), { once: true });
      previewBody.append(iframe);
    } catch (error) {
      if (isAbortError(error) || controller.signal.aborted || requestSeq !== state.previewRequestSeq) return;
      previewBody.innerHTML = "";
      if (fileExt(item.name) === "pptx") {
        try {
          const data = await api(`/api/office-preview?path=${encodeURIComponent(item.path)}`, { signal: controller.signal });
          if (requestSeq !== state.previewRequestSeq || controller.signal.aborted) return;
          renderPresentationPreview(data);
          setStatus("Layout preview failed. Showing text preview instead.");
        } catch (fallbackError) {
          if (isAbortError(fallbackError) || controller.signal.aborted || requestSeq !== state.previewRequestSeq) return;
          renderPreviewFallback(
            item,
            "Office preview failed",
            "This file can still be downloaded. If preview keeps failing, open it locally after download."
          );
          setStatus(error.message);
        }
      } else {
        renderPreviewFallback(
          item,
          "Office preview failed",
          "This file can still be downloaded. If preview keeps failing, open it locally after download."
        );
        setStatus(error.message);
      }
    }
  } else if (kind === "spreadsheet") {
    const loading = document.createElement("div");
    loading.className = "sheet-empty";
    loading.textContent = "正在加载表格...";
    previewBody.append(loading);
    try {
      const data = await api(`/api/spreadsheet-preview?path=${encodeURIComponent(item.path)}`, { signal: controller.signal });
      if (requestSeq !== state.previewRequestSeq || controller.signal.aborted) return;
      previewBody.innerHTML = "";
      renderSpreadsheetPreview(data);
    } catch (error) {
      loading.textContent = error.message || "表格预览加载失败。";
    }
  } else if (kind === "word" || kind === "presentation") {
    const loading = document.createElement("div");
    loading.className = "sheet-empty";
    loading.textContent = kind === "word" ? "正在加载 Word 预览..." : "正在加载 PPT 预览...";
    previewBody.append(loading);
    try {
      const data = await api(`/api/office-preview?path=${encodeURIComponent(item.path)}`, { signal: controller.signal });
      if (requestSeq !== state.previewRequestSeq || controller.signal.aborted) return;
      previewBody.innerHTML = "";
      if (kind === "word") renderWordPreview(data);
      else renderPresentationPreview(data);
    } catch (error) {
      loading.textContent = error.message || "Office 预览加载失败。";
    }
  } else if (kind === "text") {
    const pre = document.createElement("pre");
    pre.textContent = "正在加载文本...";
    previewBody.append(pre);
    try {
      const response = await fetch(url, { signal: controller.signal });
      if (requestSeq !== state.previewRequestSeq || controller.signal.aborted) return;
      pre.textContent = await response.text();
    } catch (error) {
      if (isAbortError(error) || controller.signal.aborted || requestSeq !== state.previewRequestSeq) return;
      pre.textContent = "文本预览加载失败。";
    }
  } else {
    const fallback = document.createElement("div");
    fallback.className = "preview-fallback";
    fallback.innerHTML = `
      <strong>这个类型暂时不能直接预览</strong>
      <span>${itemName(item)}</span>
      <small>文件大小：${formatSize(item.size)}</small>
      <p>点击右上角“下载”可以保存到电脑。本页面不会因为点击文件名而自动下载。</p>
    `;
    previewBody.append(fallback);
  }
}

function closePreview() {
  state.previewController?.abort();
  state.previewController = null;
  previewModal.classList.add("hidden");
  previewModal.setAttribute("aria-hidden", "true");
  previewBody.innerHTML = "";
  clearImagePreviewControls();
  if (previewAiSummarizeBtn) previewAiSummarizeBtn.classList.add("hidden");
  if (previewDownloadLink) previewDownloadLink.classList.remove("hidden");
  state.previewItem = null;
  void flushPendingRealtimeRefresh();
}

function setAuthMode(mode) {
  state.authMode = mode === "register" ? "register" : "login";
  loginError.textContent = "";
  loginSubmitBtn.textContent = state.authMode === "register" ? "注册并登录" : "登录";
  authModeToggle.textContent = state.authMode === "register" ? "返回登录" : "注册账号";
  password.autocomplete = state.authMode === "register" ? "new-password" : "current-password";
  registrationKeyField?.classList.toggle("hidden", state.authMode !== "register");
  if (state.authMode !== "register" && registrationKeyInput) registrationKeyInput.value = "";
}

function syncAdminUi() {
  const isAdmin = state.currentUser?.role === "admin";
  registrationKeysBtn?.classList.toggle("hidden", !isAdmin);
  userQuotasBtn?.classList.toggle("hidden", !isAdmin);
  const adminPanelCard = document.getElementById("adminPanelCard");
  if (adminPanelCard) adminPanelCard.classList.toggle("hidden", !isAdmin);

  const username = state.currentUser?.username || "";
  const userInitial = username ? username.charAt(0).toUpperCase() : "";
  const userId = state.currentUser?.id || "";
  const sidebarUsername = document.getElementById("sidebarUsername");
  const sidebarUserInitial = document.getElementById("sidebarUserInitial");
  const sidebarUserRole = document.getElementById("sidebarUserRole");

  if (sidebarUsername) {
    sidebarUsername.textContent = username;
    sidebarUsername.title = username ? `当前登录账号: ${username}` : "";
  }
  if (sidebarUserInitial) {
    sidebarUserInitial.textContent = userInitial;
  }
  if (sidebarUserRole) {
    sidebarUserRole.textContent = isAdmin ? "超级管理员" : "普通用户";
    sidebarUserRole.classList.toggle("role-user", !isAdmin);
  }

  // 同步左侧栏气泡卡片 (Popover) 身份信息
  if (popoverUsername) popoverUsername.textContent = username;
  if (popoverUserInitial) popoverUserInitial.textContent = userInitial;
  if (popoverRoleTag) {
    popoverRoleTag.textContent = isAdmin ? "超级管理员" : "普通用户";
    popoverRoleTag.classList.toggle("role-user", !isAdmin);
  }

  // Update avatar display strictly per-user across all platforms (desktop & mobile & popover)
  const token = sessionToken() || state.token || "";
  const authParam = token ? `&auth=${encodeURIComponent(token)}` : "";
  const avatarSrc = state.currentUser?.hasCustomAvatar && userId
    ? `/api/user/avatar?v=${state.avatarVersion || Date.now()}&u=${encodeURIComponent(userId)}${authParam}`
    : "";

  if (sidebarUserAvatarImg) {
    if (avatarSrc) {
      sidebarUserAvatarImg.onload = () => {
        sidebarUserAvatarImg.classList.remove("hidden");
        sidebarUserInitial?.classList.add("hidden");
      };
      sidebarUserAvatarImg.onerror = () => {
        sidebarUserAvatarImg.classList.add("hidden");
        sidebarUserInitial?.classList.remove("hidden");
      };
      sidebarUserAvatarImg.src = avatarSrc;
    } else {
      sidebarUserAvatarImg.src = "";
      sidebarUserAvatarImg.classList.add("hidden");
      sidebarUserInitial?.classList.remove("hidden");
    }
  }

  if (popoverAvatarImg) {
    if (avatarSrc) {
      popoverAvatarImg.onload = () => {
        popoverAvatarImg.classList.remove("hidden");
        popoverUserInitial?.classList.add("hidden");
      };
      popoverAvatarImg.onerror = () => {
        popoverAvatarImg.classList.add("hidden");
        popoverUserInitial?.classList.remove("hidden");
      };
      popoverAvatarImg.src = avatarSrc;
    } else {
      popoverAvatarImg.src = "";
      popoverAvatarImg.classList.add("hidden");
      popoverUserInitial?.classList.remove("hidden");
    }
  }
}

function registrationKeyStatusText(status) {
  return {
    unused: "未使用",
    used: "已使用",
    disabled: "已禁用",
    expired: "已过期",
  }[status] || "未知";
}

function registrationKeyTime(value) {
  return value ? formatTime(value) : "-";
}

function renderRegistrationKeys() {
  if (!registrationKeyList) return;
  registrationKeyList.replaceChildren();
  if (!state.registrationKeys.length) {
    const empty = document.createElement("div");
    empty.className = "registration-key-empty";
    empty.textContent = "还没有注册密钥，点击上方按钮生成一个。";
    registrationKeyList.append(empty);
    return;
  }
  for (const record of state.registrationKeys) {
    const row = document.createElement("div");
    row.className = "registration-key-row";

    const main = document.createElement("div");
    main.className = "registration-key-main";
    const code = document.createElement("div");
    code.className = "registration-key-code";
    code.textContent = record.maskedKey || "DPSIR-****";
    const meta = document.createElement("div");
    meta.className = "registration-key-meta";
    const created = document.createElement("span");
    created.textContent = `创建：${registrationKeyTime(record.createdAt)}`;
    const expires = document.createElement("span");
    expires.textContent = `过期：${registrationKeyTime(record.expiresAt)}`;
    const quotaSpan = document.createElement("span");
    quotaSpan.textContent = `配额：${record.quotaBytes ? formatSize(record.quotaBytes) : "无限制"}`;
    const used = document.createElement("span");
    used.textContent = record.usedBy ? `使用：${record.usedBy} · ${registrationKeyTime(record.usedAt)}` : "使用：-";
    meta.append(created, expires, quotaSpan, used);
    main.append(code, meta);

    const actions = document.createElement("div");
    actions.className = "registration-key-actions";
    const status = document.createElement("span");
    status.className = `registration-key-status ${record.status || "unused"}`;
    status.textContent = registrationKeyStatusText(record.status);
    actions.append(status);
    if (record.status === "unused") {
      const disableBtn = document.createElement("button");
      disableBtn.className = "ghost";
      disableBtn.type = "button";
      disableBtn.textContent = "禁用";
      disableBtn.addEventListener("click", () => disableRegistrationKey(record.id));
      actions.append(disableBtn);
    }

    row.append(main, actions);
    registrationKeyList.append(row);
  }
}

async function loadRegistrationKeys() {
  if (!registrationKeysBtn || registrationKeysBtn.classList.contains("hidden")) return;
  registrationKeysError.textContent = "";
  const data = await api("/api/registration-keys");
  state.registrationKeys = Array.isArray(data.keys) ? data.keys : [];
  renderRegistrationKeys();
}

async function openRegistrationKeysModal() {
  registrationKeysError.textContent = "";
  newRegistrationKeyPanel?.classList.add("hidden");
  if (newRegistrationKeyValue) newRegistrationKeyValue.textContent = "";
  if (newKeyQuotaSelect) newKeyQuotaSelect.value = "20";
  if (newKeyQuotaStepper) newKeyQuotaStepper.classList.add("hidden");
  if (newKeyQuotaCustomInput) newKeyQuotaCustomInput.value = "30";
  registrationKeysModal.classList.remove("hidden");
  registrationKeysModal.setAttribute("aria-hidden", "false");
  try {
    await loadRegistrationKeys();
  } catch (error) {
    registrationKeysError.textContent = error.message;
  }
}

function closeRegistrationKeysModal() {
  registrationKeysModal.classList.add("hidden");
  registrationKeysModal.setAttribute("aria-hidden", "true");
}

async function generateRegistrationKey() {
  registrationKeysError.textContent = "";
  generateRegistrationKeyBtn.disabled = true;
  try {
    const quotaVal = newKeyQuotaSelect ? newKeyQuotaSelect.value : "20";
    let quotaGb;
    if (quotaVal === "custom") {
      const customVal = Number(newKeyQuotaCustomInput ? newKeyQuotaCustomInput.value : "");
      if (!Number.isFinite(customVal) || customVal <= 0) {
        registrationKeysError.textContent = "请输入大于 0 的自定义 GB 数";
        generateRegistrationKeyBtn.disabled = false;
        return;
      }
      quotaGb = customVal;
    } else if (quotaVal === "unlimited") {
      quotaGb = "unlimited";
    } else {
      quotaGb = Number(quotaVal);
    }
    const data = await api("/api/registration-keys", {
      method: "POST",
      body: JSON.stringify({ quotaGb }),
    });
    if (newRegistrationKeyValue) newRegistrationKeyValue.textContent = data.key || "";
    newRegistrationKeyPanel?.classList.remove("hidden");
    await loadRegistrationKeys();
  } catch (error) {
    registrationKeysError.textContent = error.message;
  } finally {
    generateRegistrationKeyBtn.disabled = false;
  }
}

async function loadUserQuotas() {
  if (!userQuotasBtn || userQuotasBtn.classList.contains("hidden")) return;
  if (userQuotasError) userQuotasError.textContent = "";
  const data = await api("/api/admin/users");
  state.adminUsers = Array.isArray(data.users) ? data.users : [];
  renderUserQuotas();
}

function createQuotaStepper(initialValue = 30) {
  const stepperWrap = document.createElement("div");
  stepperWrap.className = "quota-stepper";

  const customInput = document.createElement("input");
  customInput.type = "number";
  customInput.min = "1";
  customInput.max = "9999";
  customInput.step = "1";
  customInput.className = "quota-stepper-input";
  customInput.value = initialValue;

  const unitSpan = document.createElement("span");
  unitSpan.className = "quota-stepper-unit";
  unitSpan.textContent = "GB";

  const arrowsWrap = document.createElement("div");
  arrowsWrap.className = "quota-stepper-arrows";

  const upBtn = document.createElement("button");
  upBtn.type = "button";
  upBtn.className = "quota-stepper-arrow up";
  upBtn.setAttribute("aria-label", "增加配额");
  upBtn.setAttribute("title", "增加 1 GB");
  upBtn.innerHTML = `<svg viewBox="0 0 16 16" width="13" height="13" fill="currentColor"><path d="M3.2 10.5l4.3-5.2c.3-.3.8-.3 1.1 0l4.3 5.2c.3.4.1.9-.4.9H3.6c-.5 0-.7-.5-.4-.9z"/></svg>`;
  upBtn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    const val = Math.max(1, (parseInt(customInput.value, 10) || 0) + 1);
    customInput.value = val;
    customInput.dispatchEvent(new Event("input", { bubbles: true }));
  });

  const downBtn = document.createElement("button");
  downBtn.type = "button";
  downBtn.className = "quota-stepper-arrow down";
  downBtn.setAttribute("aria-label", "减少配额");
  downBtn.setAttribute("title", "减少 1 GB");
  downBtn.innerHTML = `<svg viewBox="0 0 16 16" width="13" height="13" fill="currentColor"><path d="M3.2 5.5l4.3 5.2c.3.3.8.3 1.1 0l4.3-5.2c.3-.4.1-.9-.4-.9H3.6c-.5 0-.7.5-.4.9z"/></svg>`;
  downBtn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    const val = Math.max(1, (parseInt(customInput.value, 10) || 2) - 1);
    customInput.value = val;
    customInput.dispatchEvent(new Event("input", { bubbles: true }));
  });

  arrowsWrap.append(upBtn, downBtn);
  stepperWrap.append(customInput, unitSpan, arrowsWrap);

  return { stepperWrap, customInput };
}

function renderUserQuotas() {
  if (!userQuotaList) return;
  userQuotaList.replaceChildren();
  if (!state.adminUsers.length) {
    const empty = document.createElement("div");
    empty.className = "registration-key-empty";
    empty.textContent = "暂无用户记录。";
    userQuotaList.append(empty);
    return;
  }
  for (const user of state.adminUsers) {
    const row = document.createElement("div");
    row.className = "registration-key-row user-quota-row";

    const mainRow = document.createElement("div");
    mainRow.className = "user-quota-main-row";

    const main = document.createElement("div");
    main.className = "registration-key-main";
    const code = document.createElement("div");
    code.className = "registration-key-code";
    code.textContent = user.username;
    if (user.role === "admin") {
      const badge = document.createElement("span");
      badge.className = "registration-key-status used";
      badge.style.marginLeft = "8px";
      badge.textContent = "管理员";
      code.append(badge);
    }

    const meta = document.createElement("div");
    meta.className = "registration-key-meta";
    const used = document.createElement("span");
    used.textContent = `已占用：${formatSize(user.usedBytes || 0)}`;
    const quota = document.createElement("span");
    const quotaStr =
      user.role === "admin"
        ? "无限制 (全盘特权)"
        : user.quotaBytes
          ? formatSize(user.quotaBytes)
          : "无限制";
    quota.textContent = `空间配额：${quotaStr}`;
    meta.append(used, quota);
    main.append(code, meta);

    const actions = document.createElement("div");
    actions.className = "registration-key-actions";
    if (user.role !== "admin") {
      const editBtn = document.createElement("button");
      editBtn.className = "ghost";
      editBtn.type = "button";
      editBtn.textContent = "修改配额";
      editBtn.addEventListener("click", () => {
        const existingPanel = row.querySelector(".user-quota-edit-panel");
        if (existingPanel) {
          existingPanel.remove();
          return;
        }
        const editPanel = document.createElement("div");
        editPanel.className = "user-quota-edit-panel";

        const label = document.createElement("span");
        label.textContent = `调整 ${user.username} 的存储配额：`;

        const select = document.createElement("select");
        select.className = "quota-select-inline";
        select.innerHTML = `
          <option value="10">10 GB</option>
          <option value="20">20 GB</option>
          <option value="50">50 GB</option>
          <option value="100">100 GB</option>
          <option value="unlimited">无限制</option>
          <option value="custom">自定义 (GB)</option>
        `;
        const currentGb = user.quotaBytes
          ? Math.round(user.quotaBytes / (1024 * 1024 * 1024))
          : "unlimited";
        if (["10", "20", "50", "100", "unlimited"].includes(String(currentGb))) {
          select.value = String(currentGb);
        } else {
          select.value = "custom";
        }

        const stepper = createQuotaStepper(typeof currentGb === "number" ? currentGb : 30);
        stepper.stepperWrap.style.display = select.value === "custom" ? "inline-flex" : "none";

        select.addEventListener("change", () => {
          const isCust = select.value === "custom";
          stepper.stepperWrap.style.display = isCust ? "inline-flex" : "none";
          if (isCust) {
            stepper.customInput.focus();
          }
        });

        const saveBtn = document.createElement("button");
        saveBtn.className = "primary small-btn";
        saveBtn.type = "button";
        saveBtn.textContent = "保存";
        saveBtn.addEventListener("click", async () => {
          saveBtn.disabled = true;
          if (userQuotasError) userQuotasError.textContent = "";
          try {
            let targetGb = select.value;
            if (targetGb === "custom") {
              const customVal = Number(stepper.customInput.value);
              if (!Number.isFinite(customVal) || customVal <= 0) {
                if (userQuotasError) userQuotasError.textContent = "请输入大于 0 的自定义 GB 数";
                saveBtn.disabled = false;
                return;
              }
              targetGb = customVal;
            }
            const res = await api(`/api/admin/users/${encodeURIComponent(user.id)}/quota`, {
              method: "POST",
              body: JSON.stringify({ quotaGb: targetGb }),
            });
            user.quotaBytes = res.user.quotaBytes;
            setStatus(
              `已成功将账号“${user.username}”的空间配额修改为：${user.quotaBytes ? formatSize(user.quotaBytes) : "无限制"}`
            );
            renderUserQuotas();
          } catch (err) {
            if (userQuotasError) userQuotasError.textContent = err.message;
            saveBtn.disabled = false;
          }
        });

        const cancelBtn = document.createElement("button");
        cancelBtn.className = "ghost small-btn";
        cancelBtn.type = "button";
        cancelBtn.textContent = "取消";
        cancelBtn.addEventListener("click", () => editPanel.remove());

        editPanel.append(label, select, stepper.stepperWrap, saveBtn, cancelBtn);
        row.append(editPanel);
      });

      const resetBtn = document.createElement("button");
      resetBtn.className = "ghost";
      resetBtn.type = "button";
      resetBtn.textContent = "重置密码";
      resetBtn.title = `为用户 ${user.username} 重置登录密码`;
      resetBtn.addEventListener("click", () => {
        openAdminResetUserModal(user);
      });

      actions.append(editBtn, resetBtn);
    } else {
      const badge = document.createElement("span");
      badge.className = "registration-key-status used";
      badge.textContent = "最高特权";
      actions.append(badge);
    }

    mainRow.append(main, actions);
    row.append(mainRow);
    userQuotaList.append(row);
  }
}

async function openUserQuotasModal() {
  if (userQuotasError) userQuotasError.textContent = "";
  userQuotasModal?.classList.remove("hidden");
  userQuotasModal?.setAttribute("aria-hidden", "false");
  try {
    await loadUserQuotas();
  } catch (error) {
    if (userQuotasError) userQuotasError.textContent = error.message;
  }
}

function closeUserQuotasModal() {
  userQuotasModal?.classList.add("hidden");
  userQuotasModal?.setAttribute("aria-hidden", "true");
}

let pendingAvatarDataUrl = null;

function openUserAvatarModal() {
  pendingAvatarDataUrl = null;
  if (userAvatarModalError) userAvatarModalError.textContent = "";
  if (saveUserAvatarBtn) {
    saveUserAvatarBtn.disabled = true;
    saveUserAvatarBtn.textContent = "保存头像";
  }

  const username = state.currentUser?.username || "";
  const userInitial = username ? username.charAt(0).toUpperCase() : "";
  const userId = state.currentUser?.id || "";
  if (avatarModalPreviewInitial) avatarModalPreviewInitial.textContent = userInitial;

  if (state.currentUser?.hasCustomAvatar && avatarModalPreviewImg && userId) {
    const token = sessionToken() || state.token || "";
    const authParam = token ? `&auth=${encodeURIComponent(token)}` : "";
    const avatarSrc = `/api/user/avatar?v=${state.avatarVersion || Date.now()}&u=${encodeURIComponent(userId)}${authParam}`;
    avatarModalPreviewImg.onload = () => {
      avatarModalPreviewImg.classList.remove("hidden");
      avatarModalPreviewInitial?.classList.add("hidden");
    };
    avatarModalPreviewImg.onerror = () => {
      avatarModalPreviewImg.classList.add("hidden");
      avatarModalPreviewInitial?.classList.remove("hidden");
    };
    avatarModalPreviewImg.src = avatarSrc;
    resetAvatarDefaultBtn?.classList.remove("hidden");
  } else {
    if (avatarModalPreviewImg) {
      avatarModalPreviewImg.src = "";
      avatarModalPreviewImg.classList.add("hidden");
    }
    avatarModalPreviewInitial?.classList.remove("hidden");
    resetAvatarDefaultBtn?.classList.add("hidden");
  }

  userAvatarModal?.classList.remove("hidden");
  userAvatarModal?.setAttribute("aria-hidden", "false");
}

function closeUserAvatarModal() {
  pendingAvatarDataUrl = null;
  if (userAvatarFileInput) userAvatarFileInput.value = "";
  userAvatarModal?.classList.add("hidden");
  userAvatarModal?.setAttribute("aria-hidden", "true");
}

function processAvatarImageFile(file) {
  return new Promise((resolve, reject) => {
    if (!file) return reject(new Error("未选择文件"));
    if (!file.type.startsWith("image/")) {
      return reject(new Error("请选择有效的图片文件（JPG、PNG、WebP 等）"));
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("读取图片失败"));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error("加载图片失败，可能文件已损坏"));
      img.onload = () => {
        try {
          const size = Math.min(img.width, img.height);
          const sx = (img.width - size) / 2;
          const sy = (img.height - size) / 2;
          const canvas = document.createElement("canvas");
          const targetSize = 256;
          canvas.width = targetSize;
          canvas.height = targetSize;
          const ctx = canvas.getContext("2d");
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";
          ctx.drawImage(img, sx, sy, size, size, 0, 0, targetSize, targetSize);
          const dataUrl = canvas.toDataURL("image/png");
          resolve(dataUrl);
        } catch (err) {
          reject(err);
        }
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

async function handleAvatarFileSelect(e) {
  const file = e.target.files?.[0];
  if (!file) return;
  if (userAvatarModalError) userAvatarModalError.textContent = "";
  try {
    const dataUrl = await processAvatarImageFile(file);
    pendingAvatarDataUrl = dataUrl;
    if (avatarModalPreviewImg) {
      avatarModalPreviewImg.src = dataUrl;
      avatarModalPreviewImg.classList.remove("hidden");
    }
    avatarModalPreviewInitial?.classList.add("hidden");
    if (saveUserAvatarBtn) saveUserAvatarBtn.disabled = false;
  } catch (err) {
    if (userAvatarModalError) userAvatarModalError.textContent = err.message;
  }
}

async function saveUserAvatar() {
  if (!pendingAvatarDataUrl) return;
  if (userAvatarModalError) userAvatarModalError.textContent = "";
  if (saveUserAvatarBtn) {
    saveUserAvatarBtn.disabled = true;
    saveUserAvatarBtn.textContent = "保存中...";
  }
  try {
    await api("/api/user/avatar", {
      method: "POST",
      body: JSON.stringify({ dataUrl: pendingAvatarDataUrl }),
    });
    state.avatarVersion = Date.now();
    if (state.currentUser) {
      state.currentUser.hasCustomAvatar = true;
    }
    syncAdminUi();
    closeUserAvatarModal();
    setStatus("头像已成功更换！");
  } catch (err) {
    if (userAvatarModalError) userAvatarModalError.textContent = err.message;
    if (saveUserAvatarBtn) {
      saveUserAvatarBtn.disabled = false;
      saveUserAvatarBtn.textContent = "保存头像";
    }
  }
}

async function resetUserAvatar() {
  if (userAvatarModalError) userAvatarModalError.textContent = "";
  try {
    await api("/api/user/avatar", { method: "DELETE" });
    state.avatarVersion = Date.now();
    if (state.currentUser) {
      state.currentUser.hasCustomAvatar = false;
    }
    syncAdminUi();
    closeUserAvatarModal();
    setStatus("已恢复默认字母头像");
  } catch (err) {
    if (userAvatarModalError) userAvatarModalError.textContent = err.message;
  }
}

async function copyRegistrationKey() {
  const value = newRegistrationKeyValue?.textContent || "";
  if (!value) return;
  try {
    let copied = false;
    if (navigator.clipboard?.writeText && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(value);
        copied = true;
      } catch {}
    }
    if (!copied) {
      const textarea = document.createElement("textarea");
      textarea.value = value;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      textarea.style.top = "0";
      document.body.append(textarea);
      textarea.select();
      textarea.setSelectionRange(0, textarea.value.length);
      copied = document.execCommand("copy");
      textarea.remove();
      if (!copied) throw new Error("copy failed");
    }
    registrationKeysError.textContent = "密钥已复制。";
  } catch {
    registrationKeysError.textContent = "复制失败，请手动选中密钥复制。";
  }
}

async function disableRegistrationKey(id) {
  registrationKeysError.textContent = "";
  try {
    await api(`/api/registration-keys/${encodeURIComponent(id)}/disable`, { method: "POST", body: "{}" });
    await loadRegistrationKeys();
  } catch (error) {
    registrationKeysError.textContent = error.message;
  }
}

function openPasswordResetModal() {
  passwordResetError.textContent = "";
  resetUsernameInput.value = username.value.trim();
  resetRecoveryPasswordInput.value = "";
  resetNewPasswordInput.value = "";
  passwordResetModal.classList.remove("hidden");
  passwordResetModal.setAttribute("aria-hidden", "false");
  window.setTimeout(() => resetUsernameInput.focus(), 0);
}

function closePasswordResetModal() {
  passwordResetModal.classList.add("hidden");
  passwordResetModal.setAttribute("aria-hidden", "true");
}

async function submitPasswordReset() {
  passwordResetError.textContent = "";
  const targetUsername = resetUsernameInput.value.trim();
  try {
    await api("/api/password-reset", {
      method: "POST",
      body: JSON.stringify({
        username: targetUsername,
        recoveryKey: resetRecoveryPasswordInput.value,
        recoveryPassword: resetRecoveryPasswordInput.value,
        newPassword: resetNewPasswordInput.value,
      }),
    });
    closePasswordResetModal();
    setAuthMode("login");
    username.value = targetUsername;
    password.value = "";
    showLoginNotice("密码已成功重置，请使用新密码登录", true);
    window.setTimeout(() => password?.focus(), 80);
  } catch (error) {
    const msg = error.message || "";
    if (msg.includes("恢复密钥") || msg.includes("错误") || msg.includes("不正确") || msg.includes("失效")) {
      passwordResetError.textContent = `${msg}。若未保存或遗失恢复密钥，请联系管理员为您重置密码。`;
    } else {
      passwordResetError.textContent = msg;
    }
  }
}

function showLoginNotice(msg, isSuccess = true) {
  if (!loginError) return;
  loginError.textContent = msg;
  if (isSuccess) {
    loginError.style.color = "#16a34a";
    loginError.style.fontWeight = "600";
  } else {
    loginError.style.color = "";
    loginError.style.fontWeight = "";
  }
}

async function enterDrive(user = state.currentUser) {
  state.currentUser = user || null;
  state.avatarVersion = Date.now();
  exitTrashMode();
  exitStarredMode();
  syncAdminUi();
  loginView.classList.add("hidden");
  driveView.classList.remove("hidden");
  state.path = "";
  state.items = [];
  state.selectedPaths.clear();
  state.selectionMode = false;
  state.unlockedFolders.clear();
  clearFolderCaches();
  if (mySharesModal) mySharesModal.classList.add("hidden");
  if (mySharesList) mySharesList.innerHTML = "";
  if (shareModal) shareModal.classList.add("hidden");
  if (zipArchiveModal) zipArchiveModal.classList.add("hidden");
  if (aiDocSummaryModal) aiDocSummaryModal.classList.add("hidden");
  await api("/api/folder-unlock-session/reset", { method: "POST" });
  const params = new URLSearchParams(window.location.search);
  await loadFolder(params.get("path") || "", { replaceHistory: true });
  void refreshStarredCount();
  await refreshStorageUsage();
  await refreshAccessInfo();
  await refreshHealthStatus();
  startAccessInfoRefresh();
  startRealtimeRefresh();
  // Idle pre-warm of AI drawer DOM & GPU pipeline so first click opens with zero hitch
  const prewarmAiDrawer = () => {
    state.aiDrawer.key = aiConversationKey("global", null, state.path);
    state.aiDrawer.messages = loadAiConversation("global", null, state.aiDrawer.key);
    renderAiDrawer();
    if (aiDrawer) {
      void aiDrawer.offsetHeight;
    }
  };
  if (typeof window.requestIdleCallback === "function") {
    window.requestIdleCallback(prewarmAiDrawer, { timeout: 1500 });
  } else {
    window.setTimeout(prewarmAiDrawer, 400);
  }
}

let isSubmittingAuth = false;

async function handleLoginSubmit(event) {
  if (event && typeof event.preventDefault === "function") {
    event.preventDefault();
  }
  if (isSubmittingAuth) return;

  const originalBtnText = loginSubmitBtn ? loginSubmitBtn.textContent : "";
  isSubmittingAuth = true;
  loginError.textContent = "";
  loginError.style.color = "";
  loginError.style.fontWeight = "";

  if (loginSubmitBtn) {
    loginSubmitBtn.disabled = true;
    loginSubmitBtn.textContent = state.authMode === "register" ? "正在注册..." : "正在登录...";
  }

  try {
    const body = { username: username.value.trim(), password: password.value };
    if (state.authMode === "register") body.registrationKey = registrationKeyInput?.value || "";
    const result = await api(state.authMode === "register" ? "/api/register" : "/api/login", {
      method: "POST",
      body: JSON.stringify(body),
    });
    setSessionToken(result?.token || "");
    await enterDrive(result?.user || null);
    if (state.authMode === "register" && result?.recoveryKey) {
      openRegisterSuccessModal(result.recoveryKey, result.user?.username || username.value.trim());
    }
  } catch (error) {
    loginError.textContent = error.message;
  } finally {
    isSubmittingAuth = false;
    if (loginSubmitBtn) {
      loginSubmitBtn.disabled = false;
      loginSubmitBtn.textContent = state.authMode === "register" ? "注册并登录" : "登录";
    }
  }
}

loginForm.addEventListener("submit", handleLoginSubmit);
loginSubmitBtn?.addEventListener("click", handleLoginSubmit);

authModeToggle.addEventListener("click", () => {
  setAuthMode(state.authMode === "register" ? "login" : "register");
});

forgotPasswordBtn.addEventListener("click", openPasswordResetModal);
confirmPasswordResetBtn.addEventListener("click", submitPasswordReset);
cancelPasswordResetBtn.addEventListener("click", closePasswordResetModal);
closePasswordResetModalBtn.addEventListener("click", closePasswordResetModal);
registrationKeysBtn?.addEventListener("click", openRegistrationKeysModal);
closeRegistrationKeysModalBtn?.addEventListener("click", closeRegistrationKeysModal);
newKeyQuotaStepUp?.addEventListener("click", (e) => {
  e.preventDefault();
  if (!newKeyQuotaCustomInput) return;
  const val = Math.max(1, (parseInt(newKeyQuotaCustomInput.value, 10) || 0) + 1);
  newKeyQuotaCustomInput.value = val;
  newKeyQuotaCustomInput.dispatchEvent(new Event("input", { bubbles: true }));
});

newKeyQuotaStepDown?.addEventListener("click", (e) => {
  e.preventDefault();
  if (!newKeyQuotaCustomInput) return;
  const val = Math.max(1, (parseInt(newKeyQuotaCustomInput.value, 10) || 2) - 1);
  newKeyQuotaCustomInput.value = val;
  newKeyQuotaCustomInput.dispatchEvent(new Event("input", { bubbles: true }));
});

newKeyQuotaSelect?.addEventListener("change", () => {
  if (!newKeyQuotaStepper || !newKeyQuotaCustomInput) return;
  const isCustom = newKeyQuotaSelect.value === "custom";
  newKeyQuotaStepper.classList.toggle("hidden", !isCustom);
  if (isCustom) {
    if (!newKeyQuotaCustomInput.value) newKeyQuotaCustomInput.value = "30";
    newKeyQuotaCustomInput.focus();
  }
});
generateRegistrationKeyBtn?.addEventListener("click", generateRegistrationKey);
refreshRegistrationKeysBtn?.addEventListener("click", () => {
  loadRegistrationKeys().catch((error) => {
    registrationKeysError.textContent = error.message;
  });
});
copyRegistrationKeyBtn?.addEventListener("click", copyRegistrationKey);

userQuotasBtn?.addEventListener("click", openUserQuotasModal);
closeUserQuotasModalBtn?.addEventListener("click", closeUserQuotasModal);
refreshUserQuotasBtn?.addEventListener("click", () => {
  loadUserQuotas().catch((error) => {
    if (userQuotasError) userQuotasError.textContent = error.message;
  });
});

userAvatarContainer?.addEventListener("click", openUserAvatarModal);
userAvatarContainer?.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    openUserAvatarModal();
  }
});
closeUserAvatarModalBtn?.addEventListener("click", closeUserAvatarModal);
cancelUserAvatarBtn?.addEventListener("click", closeUserAvatarModal);
selectAvatarImageBtn?.addEventListener("click", () => userAvatarFileInput?.click());
userAvatarFileInput?.addEventListener("change", handleAvatarFileSelect);
// --- 账号与个人中心 Popover 及密码安全 ---
let isRecoveryKeyVisible = false;
let currentFullRecoveryKey = "";

function openUserAccountPopover() {
  if (!userAccountPopover || !sidebarUserDock) return;
  syncAdminUi();
  userAccountPopover.classList.remove("hidden");
  userAccountPopover.setAttribute("aria-hidden", "false");
  sidebarUserDock.classList.add("popover-open");
}

function closeUserAccountPopover() {
  if (!userAccountPopover || !sidebarUserDock) return;
  userAccountPopover.classList.add("hidden");
  userAccountPopover.setAttribute("aria-hidden", "true");
  sidebarUserDock.classList.remove("popover-open");
}

function toggleUserAccountPopover() {
  if (userAccountPopover && !userAccountPopover.classList.contains("hidden")) {
    closeUserAccountPopover();
  } else {
    openUserAccountPopover();
  }
}

function switchSecurityModalTab(mode = "change") {
  secTabChangeBtn?.classList.remove("active", "amber-active");
  secTabRecoverBtn?.classList.remove("active", "amber-active");
  secTabKeyBtn?.classList.remove("active", "amber-active");
  secChangeView?.classList.add("hidden");
  secRecoverView?.classList.add("hidden");
  secKeyView?.classList.add("hidden");

  if (mode === "change") {
    secTabChangeBtn?.classList.add("active");
    secChangeView?.classList.remove("hidden");
    if (secChangeError) secChangeError.textContent = "";
    window.setTimeout(() => secOldPasswordInput?.focus(), 50);
  } else if (mode === "recover") {
    secTabRecoverBtn?.classList.add("active", "amber-active");
    secRecoverView?.classList.remove("hidden");
    if (secRecoverError) secRecoverError.textContent = "";
    window.setTimeout(() => secRecoveryKeyInput?.focus(), 50);
  } else if (mode === "key") {
    secTabKeyBtn?.classList.add("active");
    secKeyView?.classList.remove("hidden");
    renderRecoveryKeyDisplay();
  }
}

async function fetchUserRecoveryKey() {
  try {
    const res = await api("/api/user/recovery-key");
    currentFullRecoveryKey = res?.recoveryKey || "";
    renderRecoveryKeyDisplay();
  } catch (err) {
    console.warn("获取个人恢复密钥失败:", err.message);
  }
}

function renderRecoveryKeyDisplay() {
  if (!secRecoveryKeyVal) return;
  if (!currentFullRecoveryKey) {
    secRecoveryKeyVal.textContent = "DPSIR-RCV-••••-••••";
    return;
  }
  if (isRecoveryKeyVisible) {
    secRecoveryKeyVal.textContent = currentFullRecoveryKey;
    if (secKeyEyeIcon) {
      secKeyEyeIcon.innerHTML = `<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>`;
    }
  } else {
    const parts = currentFullRecoveryKey.split("-");
    if (parts.length >= 4) {
      secRecoveryKeyVal.textContent = `${parts[0]}-${parts[1]}-••••-${parts[3]}`;
    } else {
      secRecoveryKeyVal.textContent = "DPSIR-RCV-••••-••••";
    }
    if (secKeyEyeIcon) {
      secKeyEyeIcon.innerHTML = `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>`;
    }
  }
}

async function openUserSecurityModal(tab = "change") {
  closeUserAccountPopover();
  if (secChangeError) secChangeError.textContent = "";
  if (secRecoverError) secRecoverError.textContent = "";
  if (secOldPasswordInput) secOldPasswordInput.value = "";
  if (secNewPasswordInput) secNewPasswordInput.value = "";
  if (secConfirmPasswordInput) secConfirmPasswordInput.value = "";
  if (secRecoveryKeyInput) secRecoveryKeyInput.value = "";
  if (secRecoverNewPasswordInput) secRecoverNewPasswordInput.value = "";
  if (secRecoverConfirmPasswordInput) secRecoverConfirmPasswordInput.value = "";
  if (secCurrentUsernameText) secCurrentUsernameText.textContent = state.currentUser?.username || "admin";
  isRecoveryKeyVisible = false;

  switchSecurityModalTab(tab);
  userSecurityModal?.classList.remove("hidden");
  userSecurityModal?.setAttribute("aria-hidden", "false");
  await fetchUserRecoveryKey();
}

function closeUserSecurityModal() {
  userSecurityModal?.classList.add("hidden");
  userSecurityModal?.setAttribute("aria-hidden", "true");
}

async function submitChangePassword() {
  if (secChangeError) secChangeError.textContent = "";
  const oldPassword = secOldPasswordInput?.value || "";
  const newPassword = secNewPasswordInput?.value || "";
  const confirmPassword = secConfirmPasswordInput?.value || "";

  if (!oldPassword.trim()) {
    if (secChangeError) secChangeError.textContent = "请输入当前原密码";
    secOldPasswordInput?.focus();
    return;
  }
  if (!newPassword.trim()) {
    if (secChangeError) secChangeError.textContent = "请输入新密码";
    secNewPasswordInput?.focus();
    return;
  }
  if (newPassword.length < 6) {
    if (secChangeError) secChangeError.textContent = "新密码长度至少需要 6 位";
    secNewPasswordInput?.focus();
    return;
  }
  if (newPassword !== confirmPassword) {
    if (secChangeError) secChangeError.textContent = "两次输入的新密码不一致，请重新核对";
    secConfirmPasswordInput?.focus();
    return;
  }

  if (confirmSecChangeBtn) {
    confirmSecChangeBtn.disabled = true;
    confirmSecChangeBtn.textContent = "正在修改...";
  }

  try {
    const targetUsername = state.currentUser?.username || "";
    await api("/api/user/change-password", {
      method: "POST",
      body: JSON.stringify({ oldPassword, newPassword }),
    });
    closeUserSecurityModal();
    setSessionToken("");
    await showSuccessAlert(
      "密码修改成功",
      "您的登录密码已成功更新！为保障账号安全，系统已注销所有现有登录会话，请使用新密码重新登录。",
      "前往重新登录"
    );
    clearUserSessionAndNavigateToLogin(targetUsername, "密码修改成功，请使用新密码登录");
  } catch (err) {
    if (secChangeError) secChangeError.textContent = err.message;
  } finally {
    if (confirmSecChangeBtn) {
      confirmSecChangeBtn.disabled = false;
      confirmSecChangeBtn.textContent = "确认修改密码";
    }
  }
}

async function submitRecoverPasswordInApp() {
  if (secRecoverError) secRecoverError.textContent = "";
  const recoveryKey = secRecoveryKeyInput?.value.trim() || "";
  const newPassword = secRecoverNewPasswordInput?.value || "";
  const confirmPassword = secRecoverConfirmPasswordInput?.value || "";

  if (!recoveryKey) {
    if (secRecoverError) secRecoverError.textContent = "请输入该账号专属的安全恢复密钥";
    secRecoveryKeyInput?.focus();
    return;
  }
  if (!newPassword.trim()) {
    if (secRecoverError) secRecoverError.textContent = "请输入新密码";
    secRecoverNewPasswordInput?.focus();
    return;
  }
  if (newPassword.length < 6) {
    if (secRecoverError) secRecoverError.textContent = "新密码长度至少需要 6 位";
    secRecoverNewPasswordInput?.focus();
    return;
  }
  if (newPassword !== confirmPassword) {
    if (secRecoverError) secRecoverError.textContent = "两次输入的新密码不一致，请重新核对";
    secRecoverConfirmPasswordInput?.focus();
    return;
  }

  if (confirmSecRecoverBtn) {
    confirmSecRecoverBtn.disabled = true;
    confirmSecRecoverBtn.textContent = "正在重置...";
  }

  try {
    const targetUsername = state.currentUser?.username || "";
    await api("/api/password-reset", {
      method: "POST",
      body: JSON.stringify({
        username: targetUsername,
        recoveryKey,
        newPassword,
      }),
    });
    closeUserSecurityModal();
    setSessionToken("");
    await showSuccessAlert(
      "密码重置成功",
      "您已凭专属安全恢复密钥成功重置登录密码！为保障账号安全，系统已注销所有现有登录会话，请使用新密码重新登录。",
      "前往重新登录"
    );
    clearUserSessionAndNavigateToLogin(targetUsername, "密码重置成功，请使用新密码登录");
  } catch (err) {
    if (secRecoverError) secRecoverError.textContent = err.message;
  } finally {
    if (confirmSecRecoverBtn) {
      confirmSecRecoverBtn.disabled = false;
      confirmSecRecoverBtn.textContent = "凭密钥重置密码";
    }
  }
}

async function handleRegenerateRecoveryKey() {
  const confirmed = await showConfirmDialog(
    "重新生成安全恢复密钥",
    "重新生成后，旧的安全恢复密钥将立即作废失效。您确定要为当前账号生成新的安全恢复密钥吗？"
  );
  if (!confirmed) return;

  try {
    const res = await api("/api/user/recovery-key/regenerate", { method: "POST" });
    currentFullRecoveryKey = res?.recoveryKey || "";
    isRecoveryKeyVisible = true;
    renderRecoveryKeyDisplay();
    setStatus("已成功生成全新的专属安全恢复密钥，请妥善保存！");
  } catch (err) {
    alert("重新生成密钥失败：" + err.message);
  }
}

function copyRecoveryKeyText(key, btnTextEl) {
  if (!key) return;
  let copied = false;
  if (navigator.clipboard?.writeText && window.isSecureContext) {
    navigator.clipboard.writeText(key).then(() => {
      onCopySuccess();
    }).catch(() => {
      fallbackCopy();
    });
  } else {
    fallbackCopy();
  }

  function fallbackCopy() {
    try {
      const textarea = document.createElement("textarea");
      textarea.value = key;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      document.body.append(textarea);
      textarea.select();
      copied = document.execCommand("copy");
      textarea.remove();
      if (copied) onCopySuccess();
      else setStatus("复制失败，请手动选中文本复制");
    } catch {
      setStatus("复制失败，请手动选中文本复制");
    }
  }

  function onCopySuccess() {
    if (btnTextEl) {
      const orig = btnTextEl.textContent;
      btnTextEl.textContent = "已复制✓";
      window.setTimeout(() => {
        btnTextEl.textContent = orig;
      }, 2000);
    }
    setStatus("安全恢复密钥已复制到剪贴板！");
  }
}

function openRegisterSuccessModal(key, username) {
  if (!registerSuccessModal) return;
  state.lastRegisteredUsername = username || state.currentUser?.username || "";
  if (newAccountRecoveryKeyText) newAccountRecoveryKeyText.textContent = key || "DPSIR-RCV-XXXX-XXXX";
  registerSuccessModal.classList.remove("hidden");
  registerSuccessModal.setAttribute("aria-hidden", "false");
}

function closeRegisterSuccessModal() {
  if (!registerSuccessModal) return;
  registerSuccessModal.classList.add("hidden");
  registerSuccessModal.setAttribute("aria-hidden", "true");
}

function downloadRecoveryCredentialCard(username, recoveryKey) {
  const cleanUser = String(username || state.currentUser?.username || "user").trim();
  const cleanKey = String(recoveryKey || "").trim();
  if (!cleanKey || cleanKey.includes("•")) {
    setStatus("恢复密钥无效或未完整显示，无法下载凭据");
    return;
  }
  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const timeStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  const origin = window.location.origin;

  const content = `================================================================
              DPSir 智云盘 - 账号安全应急凭据卡
================================================================
账号名称: ${cleanUser}
专属安全恢复密钥: ${cleanKey}
凭据生成时间: ${timeStr}
网盘访问地址: ${origin}

【核心安全使用说明】
1. 当您遗忘登录密码时，此密钥是在登录页自助找回账号的唯一凭据。
2. 出于数据安全保护机制，在未登录状态下系统无法直接查询此密钥。
3. 请将本文件妥善保存在个人受保护的离线存储（如个人U盘、安全备忘录或密码管理器中）。
4. 若日后在云盘个人设置中重新生成了新密钥，此旧凭据卡将立即作废失效。
================================================================`;

  try {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `DPSir_安全恢复凭据_${cleanUser}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setStatus("应急凭据卡已成功生成并下载至本地！");
  } catch (err) {
    setStatus("生成凭据文件失败：" + err.message);
  }
}

// 管理员重置普通用户凭据弹窗控制器
let currentAdminResetTarget = null;

function openAdminResetUserModal(user) {
  if (!adminResetUserModal || !user) return;
  currentAdminResetTarget = user;
  if (adminResetTargetUsername) adminResetTargetUsername.textContent = user.username;
  if (adminResetPasswordInput) adminResetPasswordInput.value = "";
  if (adminResetUserError) adminResetUserError.textContent = "";
  adminResetUserModal.classList.remove("hidden");
  adminResetUserModal.setAttribute("aria-hidden", "false");
  window.setTimeout(() => adminResetPasswordInput?.focus(), 50);
}

function closeAdminResetUserModal() {
  if (!adminResetUserModal) return;
  adminResetUserModal.classList.add("hidden");
  adminResetUserModal.setAttribute("aria-hidden", "true");
  currentAdminResetTarget = null;
}

function generateRandomTempPassword(length = 8) {
  const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789#@!%";
  let pwd = "";
  for (let i = 0; i < length; i++) {
    pwd += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pwd;
}

closeAdminResetUserModalBtn?.addEventListener("click", closeAdminResetUserModal);
cancelAdminResetUserModalBtn?.addEventListener("click", closeAdminResetUserModal);

adminGenRandomPwdBtn?.addEventListener("click", () => {
  if (adminResetPasswordInput) {
    adminResetPasswordInput.value = generateRandomTempPassword(8);
  }
});

adminSubmitNewPwdBtn?.addEventListener("click", async () => {
  if (!currentAdminResetTarget) return;
  const newPwd = adminResetPasswordInput?.value?.trim();
  if (!newPwd || newPwd.length < 6) {
    if (adminResetUserError) adminResetUserError.textContent = "临时密码至少需要 6 位字符";
    return;
  }
  adminSubmitNewPwdBtn.disabled = true;
  adminSubmitNewPwdBtn.textContent = "正在重置...";
  if (adminResetUserError) adminResetUserError.textContent = "";
  try {
    const res = await api(`/api/admin/users/${encodeURIComponent(currentAdminResetTarget.id)}/reset-password`, {
      method: "POST",
      body: JSON.stringify({ newPassword: newPwd }),
    });
    setStatus(`已将用户“${currentAdminResetTarget.username}”的密码重置为：${newPwd}`);
    await showConfirmDialog(
      "密码重置成功",
      `已成功将用户“${currentAdminResetTarget.username}”的登录密码重置为：\n\n${newPwd}\n\n请将该临时密码告知用户，并提醒其登录后及时在个人设置中修改。`
    );
    closeAdminResetUserModal();
  } catch (err) {
    if (adminResetUserError) adminResetUserError.textContent = err.message;
  } finally {
    adminSubmitNewPwdBtn.disabled = false;
    adminSubmitNewPwdBtn.textContent = "确认重置密码";
  }
});

// 绑定侧边栏交互：仅点击圆形折叠箭头触发 Popover，点击头像打开头像设置，点击跑道外框不弹出
userAvatarContainer?.addEventListener("click", (e) => {
  e.stopPropagation();
  closeUserAccountPopover();
  openUserAvatarModal();
});

sidebarUserMenuBtn?.addEventListener("click", (e) => {
  e.stopPropagation();
  toggleUserAccountPopover();
});

popoverChangeAvatarBtn?.addEventListener("click", () => {
  closeUserAccountPopover();
  openUserAvatarModal();
});

popoverSecurityBtn?.addEventListener("click", () => {
  closeUserAccountPopover();
  openUserSecurityModal("change");
});

popoverLogoutBtn?.addEventListener("click", () => {
  closeUserAccountPopover();
  $("#logoutBtn").click();
});

secTabChangeBtn?.addEventListener("click", () => switchSecurityModalTab("change"));
secTabRecoverBtn?.addEventListener("click", () => switchSecurityModalTab("recover"));
secTabKeyBtn?.addEventListener("click", () => switchSecurityModalTab("key"));
secForgotOldPwdLink?.addEventListener("click", () => switchSecurityModalTab("recover"));
secViewMyKeyLink?.addEventListener("click", () => switchSecurityModalTab("key"));
secKeyGoResetLink?.addEventListener("click", () => switchSecurityModalTab("recover"));
confirmSecChangeBtn?.addEventListener("click", submitChangePassword);
cancelSecChangeBtn?.addEventListener("click", closeUserSecurityModal);
closeUserSecurityModalBtn?.addEventListener("click", closeUserSecurityModal);
confirmSecRecoverBtn?.addEventListener("click", submitRecoverPasswordInApp);
cancelSecRecoverBtn?.addEventListener("click", closeUserSecurityModal);
closeSecKeyViewBtn?.addEventListener("click", closeUserSecurityModal);

secRegenerateKeyBtn?.addEventListener("click", handleRegenerateRecoveryKey);
secToggleKeyVisibilityBtn?.addEventListener("click", () => {
  isRecoveryKeyVisible = !isRecoveryKeyVisible;
  renderRecoveryKeyDisplay();
});
secCopyKeyBtn?.addEventListener("click", () => copyRecoveryKeyText(currentFullRecoveryKey, secCopyKeyBtnText));

secDownloadKeyBtn?.addEventListener("click", async () => {
  let keyToDownload = currentFullRecoveryKey;
  if (!keyToDownload || keyToDownload.includes("•")) {
    try {
      const res = await api("/api/user/recovery-key");
      if (res?.recoveryKey) {
        currentFullRecoveryKey = res.recoveryKey;
        keyToDownload = res.recoveryKey;
      }
    } catch {}
  }
  downloadRecoveryCredentialCard(state.currentUser?.username || "user", keyToDownload);
});

copyNewAccountRecoveryKeyBtn?.addEventListener("click", () => copyRecoveryKeyText(newAccountRecoveryKeyText?.textContent, copyNewAccountRecoveryKeyBtn?.querySelector("span")));
downloadNewAccountRecoveryKeyBtn?.addEventListener("click", () => {
  const key = newAccountRecoveryKeyText?.textContent?.trim();
  const uname = state.lastRegisteredUsername || state.currentUser?.username || "新用户";
  downloadRecoveryCredentialCard(uname, key);
});
confirmRegisterSuccessBtn?.addEventListener("click", closeRegisterSuccessModal);

function clearUserSessionAndNavigateToLogin(prefilledUsername = "", successNotice = "") {
  setSessionToken("");
  state.currentUser = null;
  state.avatarVersion = null;
  pendingAvatarDataUrl = null;
  state.path = "";
  state.items = [];
  if (sidebarUserAvatarImg) {
    sidebarUserAvatarImg.src = "";
    sidebarUserAvatarImg.classList.add("hidden");
  }
  if (sidebarUserInitial) {
    sidebarUserInitial.textContent = "";
    sidebarUserInitial.classList.remove("hidden");
  }
  if (avatarModalPreviewImg) {
    avatarModalPreviewImg.src = "";
    avatarModalPreviewImg.classList.add("hidden");
  }
  if (avatarModalPreviewInitial) {
    avatarModalPreviewInitial.textContent = "";
    avatarModalPreviewInitial.classList.remove("hidden");
  }
  const sidebarUsernameEl = document.getElementById("sidebarUsername");
  const sidebarUserRoleEl = document.getElementById("sidebarUserRole");
  if (sidebarUsernameEl) {
    sidebarUsernameEl.textContent = "";
    sidebarUsernameEl.removeAttribute("title");
  }
  if (sidebarUserRoleEl) {
    sidebarUserRoleEl.textContent = "";
    sidebarUserRoleEl.classList.remove("role-user");
  }
  exitTrashMode();
  exitStarredMode();
  clearSelection();
  state.unlockedFolders.clear();
  clearFolderCaches();
  if (mySharesModal) mySharesModal.classList.add("hidden");
  if (mySharesList) mySharesList.innerHTML = "";
  if (shareModal) shareModal.classList.add("hidden");
  if (zipArchiveModal) zipArchiveModal.classList.add("hidden");
  if (aiDocSummaryModal) aiDocSummaryModal.classList.add("hidden");
  syncAdminUi();
  state.eventSource?.close();
  state.eventSource = null;
  if (state.accessInfoTimer) window.clearInterval(state.accessInfoTimer);
  state.accessInfoTimer = null;
  if (state.storageUsageTimer) window.clearInterval(state.storageUsageTimer);
  state.storageUsageTimer = null;
  if (state.healthTimer) window.clearInterval(state.healthTimer);
  state.healthTimer = null;
  closeAiDrawer();
  driveView.classList.add("hidden");
  loginView.classList.remove("hidden");
  setAuthMode("login");
  if (prefilledUsername && username) {
    username.value = prefilledUsername;
  }
  if (password) {
    password.value = "";
    window.setTimeout(() => password.focus(), 80);
  }
  if (successNotice) {
    showLoginNotice(successNotice, true);
  }
}

$("#logoutBtn").addEventListener("click", async () => {
  const ok = await showConfirmDialog("退出登录", "确认退出当前网盘账号吗？");
  if (!ok) return;
  await api("/api/logout", { method: "POST", body: "{}" }).catch(() => {});
  clearUserSessionAndNavigateToLogin();
});

backBtn.addEventListener("click", () => {
  if (state.trashMode) {
    exitTrashMode();
    loadFolder(state.path || "");
    return;
  }
  if (state.starredMode) {
    exitStarredMode();
    loadFolder(state.path || "");
    return;
  }
  loadFolder(parentPath(state.path));
});
$("#uploadBtn").addEventListener("click", openUploadModal);
aiModeToggleBtn?.addEventListener("click", () => setAiModeEnabled(!state.aiModeEnabled));
aiGlobalSearchBtn?.addEventListener("click", openAiGlobalSearchPlaceholder);
aiHistoryBtn?.addEventListener("click", toggleAiHistoryPanel);
aiNewChatBtn?.addEventListener("click", startNewAiChat);
aiCloseHistoryBtn?.addEventListener("click", closeAiHistoryPanel);
aiClearAllHistoryBtn?.addEventListener("click", clearAllAiSessions);
aiDrawerCloseBtn?.addEventListener("click", closeAiDrawer);
aiDrawerBackdrop?.addEventListener("click", closeAiDrawer);
aiDrawerBackBtn?.addEventListener("click", handleAiDrawerBackOrSwitch);
aiWebSearchToggleBtn?.addEventListener("click", () => setAiWebSearchEnabled(!state.aiWebSearchEnabled));
aiPromptForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  pulseAiSendButton();
  void submitAiPrompt();
});
aiPromptInput?.addEventListener("input", () => {
  syncAiPromptSendState();
  autoResizeAiPromptInput();
});
aiPromptInput?.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" || event.shiftKey || event.isComposing) return;
  event.preventDefault();
  pulseAiSendButton();
  void submitAiPrompt();
});
aiPromptSendBtn?.addEventListener("pointerdown", pulseAiSendButton);
selectModeBtn.addEventListener("click", () => toggleSelectionMode());
selectAllBtn.addEventListener("click", toggleAllSelection);
bulkDownloadBtn.addEventListener("click", bulkDownloadSelected);
bulkShareBtn?.addEventListener("click", bulkShareSelected);
bulkCopyBtn.addEventListener("click", bulkCopySelected);
bulkMoveBtn.addEventListener("click", openBulkMoveModal);
bulkDeleteBtn.addEventListener("click", bulkDeleteSelected);
clearSelectionBtn.addEventListener("click", clearSelection);
closeUploadModalBtn.addEventListener("click", closeUploadModal);
cancelUploadTargetBtn.addEventListener("click", closeUploadModal);
closeBulkMoveModalBtn.addEventListener("click", closeBulkMoveModal);
cancelBulkMoveBtn.addEventListener("click", closeBulkMoveModal);
confirmBulkMoveBtn.addEventListener("click", bulkMoveSelected);
confirmFolderPasswordBtn.addEventListener("click", () => submitFolderPasswordDialog(false));
resetFolderPasswordBtn.addEventListener("click", switchToFolderPasswordReset);
removeFolderPasswordBtn.addEventListener("click", () => submitFolderPasswordDialog(true));
confirmDialogBtn.addEventListener("click", submitDialogModal);
cancelDialogBtn.addEventListener("click", () => {
  const resolve = state.dialog?.resolve;
  closeDialogModal();
  if (resolve) resolve(null);
});
closeDialogModalBtn.addEventListener("click", () => {
  const resolve = state.dialog?.resolve;
  closeDialogModal();
  if (resolve) resolve(null);
});
cancelFolderPasswordBtn.addEventListener("click", () => {
  const resolve = state.folderPasswordDialog?.resolve;
  closeFolderPasswordModal();
  if (resolve) resolve(null);
});
closeFolderPasswordModalBtn.addEventListener("click", () => {
  const resolve = state.folderPasswordDialog?.resolve;
  closeFolderPasswordModal();
  if (resolve) resolve(null);
});
chooseFilesBtn.addEventListener("click", () => {
  state.uploadTargetPath = uploadFolderSelect.value;
  closeUploadModal();
  openFilePicker(fileInput);
});
chooseFolderBtn.addEventListener("click", () => {
  state.uploadTargetPath = uploadFolderSelect.value;
  closeUploadModal();
  openFilePicker(folderInput);
});
fileInput.addEventListener("change", () => handleFileInputChange(fileInput));
folderInput.addEventListener("change", () => handleFileInputChange(folderInput));

$("#newFolderBtn").addEventListener("click", async () => {
  const trimmedName = await askForFolderName();
  if (!trimmedName) return;
  const payload = await openFolderPasswordDialog({
    mode: "create",
    folderPath: joinPath(state.path, trimmedName),
    folderName: trimmedName,
    locked: false,
  });
  if (!payload) return;
  const targetPath = joinPath(state.path, trimmedName);
  try {
    state.busy = true;
    setStatus("正在创建文件夹...");
    await api("/api/folder", {
      method: "POST",
      body: JSON.stringify({
        path: state.path,
        name: trimmedName,
        password: payload.password,
        adminPassword: payload.adminPassword,
      }),
    });
    if (payload.password.trim()) markFolderUnlockedEverywhere(targetPath);
    clearFolderCaches();
    suppressNextRealtimeRefresh();
    await loadFolder(targetPath, { forceRefresh: true });
    scheduleStorageUsageRefresh({ force: true });
    setStatus(`已进入“${trimmedName}”，上传会默认选择这里`);
  } catch (error) {
    await showErrorDialog(error.message);
    setStatus(error.message);
  } finally {
    state.busy = false;
    void flushPendingRealtimeRefresh();
  }
});

searchBtn?.addEventListener("click", performSearch);
clearSearchBtn?.addEventListener("click", clearSearch);
searchInput?.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" || event.isComposing) return;
  event.preventDefault();
  performSearch();
});
searchSort?.addEventListener("change", () => {
  if (!state.searchActive) return;
  updateSearchVisibleItems({ render: true });
});

$("#refreshBtn").addEventListener("click", () => {
  if (state.trashMode) {
    loadTrash();
    return;
  }
  if (state.starredMode) {
    loadStarred();
    return;
  }
  if (state.searchActive) {
    performSearch();
    return;
  }
  loadFolder(state.path, { replaceHistory: true, forceRefresh: true, animateAi: state.aiModeEnabled });
});
closePreviewBtn.addEventListener("click", closePreview);

for (const modal of [uploadModal, previewModal, bulkMoveModal, folderPasswordModal, dialogModal, passwordResetModal, registrationKeysModal, userQuotasModal, userAvatarModal, userSecurityModal, registerSuccessModal, adminResetUserModal]) {
  if (!modal) continue;
  modal.addEventListener("click", (event) => {
    if (event.target !== modal) return;
    if (modal === uploadModal) return;
    if (modal === previewModal) return;
    if (modal === bulkMoveModal) return;
    if (modal === folderPasswordModal) return;
    if (modal === dialogModal) return;
    if (modal === passwordResetModal) return;
    if (modal === registrationKeysModal) return;
    if (modal === userQuotasModal) return;
    if (modal === userAvatarModal) return closeUserAvatarModal();
    if (modal === userSecurityModal) return closeUserSecurityModal();
    if (modal === registerSuccessModal) return closeRegisterSuccessModal();
    if (modal === adminResetUserModal) return closeAdminResetUserModal();
  });
}

function isTypingMultiline(event) {
  const target = event.target;
  return target?.tagName === "TEXTAREA" || target?.isContentEditable;
}

function isFolderDropdownInteraction(event) {
  return Boolean(event.target?.closest?.(".folder-combobox"));
}

function clickIfVisible(button) {
  if (!button || button.disabled || button.classList.contains("hidden")) return false;
  button.click();
  return true;
}

function handleEnterConfirm(event) {
  if (event.key !== "Enter" || event.isComposing || event.shiftKey || isTypingMultiline(event)) return false;
  if (isFolderDropdownInteraction(event)) return false;
  if (isModalOpen(registrationKeysModal)) return clickIfVisible(generateRegistrationKeyBtn);
  if (isModalOpen(passwordResetModal)) return clickIfVisible(confirmPasswordResetBtn);
  if (isModalOpen(dialogModal)) return clickIfVisible(confirmDialogBtn);
  if (isModalOpen(folderPasswordModal)) {
    const isDelete = state.folderPasswordDialog?.mode === "delete";
    return clickIfVisible(isDelete ? removeFolderPasswordBtn : confirmFolderPasswordBtn);
  }
  if (isModalOpen(bulkMoveModal)) return clickIfVisible(confirmBulkMoveBtn);
  return false;
}

document.addEventListener("keydown", (event) => {
  if (handleEnterConfirm(event)) {
    event.preventDefault();
    event.stopPropagation();
    return;
  }
  if (isModalOpen(previewModal) && previewKind(state.previewItem?.name || "") === "image") {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      switchImagePreview(-1);
      return;
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      switchImagePreview(1);
      return;
    }
  }
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "a") {
    const activeEl = document.activeElement;
    const tagName = activeEl?.tagName?.toLowerCase();
    if (tagName === "input" || tagName === "textarea" || activeEl?.isContentEditable) {
      return;
    }
    if (document.querySelector(".modal:not(.hidden)")) {
      return;
    }
    if (driveView && driveView.classList.contains("hidden")) {
      return;
    }
    if (state.items && state.items.length > 0) {
      event.preventDefault();
      state.selectedPaths.clear();
      for (const item of state.items) {
        state.selectedPaths.add(itemKeyOf(item));
      }
      state.selectionMode = true;
      updateSelectionUi();
      syncSelectionRows();
      return;
    }
  }

  if (event.key !== "Escape") return;
  if (closeAllFolderDropdowns()) {
    event.preventDefault();
    event.stopPropagation();
    return;
  }
  const hadOpenModal = Boolean(document.querySelector(".modal:not(.hidden)"));
  closeUserAccountPopover();
  closeUploadModal();
  closeBulkMoveModal();
  closePreview();
  closeAiDrawer();
  closePasswordResetModal();
  closeRegistrationKeysModal();
  closeUserQuotasModal();
  closeUserAvatarModal();
  closeUserSecurityModal();
  closeRegisterSuccessModal();
  closeAdminResetUserModal();
  if (zipArchiveModal) zipArchiveModal.classList.add("hidden");
  if (shareModal) shareModal.classList.add("hidden");
  if (mySharesModal) mySharesModal.classList.add("hidden");
  if (aiDocSummaryModal) closeAiDocSummaryModal();
  if (!hadOpenModal && state.selectionMode) {
    clearSelection();
  }
});

document.addEventListener("click", (event) => {
  if (!event.target?.closest?.("#sidebarUserMenuBtn") && !event.target?.closest?.("#userAccountPopover")) {
    closeUserAccountPopover();
  }
  if (isFolderDropdownInteraction(event)) return;
  closeAllFolderDropdowns();
});

async function extractDroppedItems(dataTransfer) {
  const items = dataTransfer?.items;
  if (!items || !items.length) {
    return {
      files: [...(dataTransfer?.files || [])],
      emptyDirs: [],
    };
  }

  const entries = [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item && (item.kind === "file" || !item.kind)) {
      try {
        const entry = typeof item.webkitGetAsEntry === "function" ? item.webkitGetAsEntry() : null;
        if (entry) {
          entries.push(entry);
        }
      } catch (err) {
        console.warn("Could not get entry for dropped item", err);
      }
    }
  }

  // If no entries could be extracted, fall back to dataTransfer.files
  if (!entries.length) {
    return {
      files: [...(dataTransfer?.files || [])],
      emptyDirs: [],
    };
  }

  const files = [];
  const emptyDirs = [];

  // Helper to read all entries from a directory reader (handles batching of up to 100 entries per call)
  async function readAllEntriesFromReader(dirReader) {
    const entries = [];
    while (true) {
      const batch = await new Promise((resolve) => {
        dirReader.readEntries(
          (results) => resolve(results || []),
          () => resolve([])
        );
      });
      if (!batch || batch.length === 0) break;
      entries.push(...batch);
    }
    return entries;
  }

  async function traverse(entry, parentPath = "") {
    if (!entry) return;
    if (entry.isFile) {
      const file = await new Promise((resolve) => {
        entry.file(
          (f) => resolve(f),
          () => resolve(null)
        );
      });
      if (file) {
        const relPath = parentPath ? `${parentPath}/${file.name}` : file.name;
        try {
          Object.defineProperty(file, "relativePath", {
            value: relPath,
            writable: true,
            configurable: true,
          });
        } catch {
          file.relativePath = relPath;
        }
        files.push(file);
      }
    } else if (entry.isDirectory) {
      const dirPath = parentPath ? `${parentPath}/${entry.name}` : entry.name;
      const reader = entry.createReader();
      try {
        const children = await readAllEntriesFromReader(reader);
        if (children.length === 0) {
          emptyDirs.push(dirPath);
        } else {
          for (const child of children) {
            await traverse(child, dirPath);
          }
        }
      } catch (err) {
        console.warn("Failed to read directory entries for", dirPath, err);
      }
    }
  }

  for (const entry of entries) {
    await traverse(entry, "");
  }

  return { files, emptyDirs };
}

async function ensureFolderPathExists(dirRelPath, basePath = state.path) {
  const parts = String(dirRelPath).replaceAll("\\", "/").split("/").filter(Boolean);
  let curPath = basePath;
  for (const part of parts) {
    try {
      await api("/api/folder", {
        method: "POST",
        body: JSON.stringify({ path: curPath, name: part }),
      });
    } catch {
      // Ignore if folder already exists or cannot be created
    }
    curPath = curPath ? `${curPath}/${part}` : part;
  }
}

let dropZoneDragCounter = 0;

window.addEventListener("dragover", (event) => {
  if (isExternalFileDrag(event)) {
    event.preventDefault();
  }
});

window.addEventListener("drop", (event) => {
  if (isExternalFileDrag(event)) {
    event.preventDefault();
  }
});

dropZone.addEventListener("dragenter", (event) => {
  if (!isExternalFileDrag(event)) return;
  event.preventDefault();
  dropZoneDragCounter += 1;
  dropZone.classList.add("dragging");
});

dropZone.addEventListener("dragover", (event) => {
  if (!isExternalFileDrag(event)) return;
  event.preventDefault();
  event.dataTransfer.dropEffect = "copy";
  dropZone.classList.add("dragging");
});

dropZone.addEventListener("dragleave", () => {
  dropZoneDragCounter = Math.max(0, dropZoneDragCounter - 1);
  if (dropZoneDragCounter === 0) {
    dropZone.classList.remove("dragging");
  }
});

dropZone.addEventListener("drop", async (event) => {
  dropZoneDragCounter = 0;
  dropZone.classList.remove("dragging");
  if (!isExternalFileDrag(event)) return;
  event.preventDefault();

  try {
    setStatus("正在解析拖入的项目与目录结构...");
    const { files, emptyDirs } = await extractDroppedItems(event.dataTransfer);

    if (emptyDirs.length > 0) {
      for (const emptyDir of emptyDirs) {
        await ensureFolderPathExists(emptyDir, state.path);
      }
    }

    if (files.length > 0) {
      const hasFolders = emptyDirs.length > 0 || files.some((f) => fileRelativePath(f).includes("/"));
      if (hasFolders) {
        setStatus(`已解析 ${files.length} 个文件${emptyDirs.length ? `（含 ${emptyDirs.length} 个空目录）` : ""}，准备上传...`);
      }
      await uploadFiles(files, state.path);
    } else if (emptyDirs.length > 0) {
      await loadFolder(state.path, { replaceHistory: true, forceRefresh: true });
      setStatus(`已成功创建 ${emptyDirs.length} 个空文件夹`);
    } else {
      setStatus("未检测到可上传的文件。");
    }
  } catch (error) {
    console.error("处理拖入文件失败:", error);
    await showErrorDialog("读取拖入文件失败：" + (error.message || "未知错误"));
  }
});

window.addEventListener("popstate", (event) => {
  loadFolder(event.state?.path || "", { skipHistory: true }).catch((error) => {
    void showErrorDialog(error.message);
  });
});

window.addEventListener("focus", refreshAccessInfoSoon);
window.addEventListener("online", refreshAccessInfoSoon);
window.addEventListener("offline", () => refreshAccessInfoSoon({ allowSwitch: false }));
window.addEventListener("pageshow", () => {
  refreshAccessInfoSoon();
  refreshUserSessionState();
});
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) {
    refreshAccessInfoSoon();
    refreshUserSessionState();
  }
});

function refreshUserSessionState() {
  if (driveView && !driveView.classList.contains("hidden") && state.currentUser) {
    api("/api/me").then((me) => {
      if (me?.user) {
        const avatarChanged = me.user.hasCustomAvatar !== state.currentUser?.hasCustomAvatar;
        state.currentUser = me.user;
        if (avatarChanged) {
          state.avatarVersion = Date.now();
        }
        syncAdminUi();
      }
    }).catch(() => {});
  }
}

/* =========================================================
   新增功能逻辑：回收站、ZIP浏览、外链分享、AI总结、手势
   ========================================================= */

// --- 0. 星标收藏逻辑 ---
function exitStarredMode() {
  if (!state.starredMode) return;
  state.starredMode = false;
  state.selectedPaths.clear();
  state.selectionMode = false;
  updateSelectionUi();
  syncSelectionRows();
  syncAiGlobalBtnUi();
  const starredNavBtn = $("#starredNavBtn");
  if (starredNavBtn) starredNavBtn.classList.remove("active");
  const uploadBtn = $("#uploadBtn");
  const newFolderBtn = $("#newFolderBtn");
  const selectModeBtn = $("#selectModeBtn");
  if (uploadBtn) uploadBtn.classList.remove("hidden");
  if (newFolderBtn) newFolderBtn.classList.remove("hidden");
  if (selectModeBtn) selectModeBtn.classList.remove("hidden");
}

async function loadStarred(options = {}) {
  exitTrashMode();
  state.starredMode = true;
  state.searchActive = false;
  if (!options?.preserveSelection) {
    state.selectedPaths.clear();
    state.selectionMode = false;
    state.lastAnchorKey = "";
  }
  updateSelectionUi();
  syncAiGlobalBtnUi();

  const starredNavBtn = $("#starredNavBtn");
  if (starredNavBtn) starredNavBtn.classList.add("active");

  const uploadBtn = $("#uploadBtn");
  const newFolderBtn = $("#newFolderBtn");
  const selectModeBtn = $("#selectModeBtn");
  if (uploadBtn) uploadBtn.classList.add("hidden");
  if (newFolderBtn) newFolderBtn.classList.add("hidden");
  if (selectModeBtn) selectModeBtn.classList.remove("hidden");

  if (currentFolderLabel) currentFolderLabel.textContent = "⭐ 我的星标";
  backBtn.disabled = false;
  renderBreadcrumb();
  if (!options?.silent) setStatus("正在加载星标项目...");

  try {
    const res = await api("/api/starred");
    state.items = (res.items || []).map((item) => ({
      ...item,
      starred: true,
    }));
    const badge = $("#sidebarStarredCount");
    if (badge) {
      badge.textContent = state.items.length;
      badge.classList.toggle("has-count", state.items.length > 0);
    }
    renderRows({ noAnimation: true });
    if (!options?.silent) setStatus(`我的星标共有 ${state.items.length} 个项目。`);
  } catch (err) {
    if (!options?.silent) setStatus("加载星标项目失败: " + err.message);
  }
}

async function toggleStarItem(item) {
  if (!item || !item.path) return;
  try {
    suppressNextRealtimeRefresh();
    const res = await api("/api/starred/toggle", {
      method: "POST",
      body: JSON.stringify({ path: item.path }),
    });
    const nowStarred = res.starred;
    item.starred = nowStarred;
    setStatus(nowStarred ? `已将“${itemName(item)}”设为星标` : `已取消“${itemName(item)}”的星标`);
    refreshStarredCount();
    if (state.starredMode) {
      await loadStarred({ silent: true });
    } else {
      renderRows({ noAnimation: true });
    }
  } catch (err) {
    showErrorDialog(err.message || "更新星标失败");
  }
}

async function bulkStarSelected() {
  const selectedPaths = Array.from(state.selectedPaths);
  if (!selectedPaths.length) return;
  const allStarred = selectedPaths.every((p) => {
    const found = state.items.find((it) => it.path === p);
    return found && found.starred;
  });
  const nextStarred = !allStarred;
  try {
    suppressNextRealtimeRefresh();
    const res = await api("/api/starred/batch", {
      method: "POST",
      body: JSON.stringify({ paths: selectedPaths, starred: nextStarred }),
    });
    setStatus(nextStarred ? `已将选中的 ${res.count} 个项目设为星标` : `已取消选中的 ${res.count} 个项目的星标`);
    refreshStarredCount();
    if (state.starredMode) {
      await loadStarred({ silent: true });
    } else {
      for (const it of state.items) {
        if (state.selectedPaths.has(it.path)) {
          it.starred = nextStarred;
        }
      }
      updateSelectionUi();
      renderRows({ noAnimation: true });
    }
  } catch (err) {
    showErrorDialog(err.message || "批量更新星标失败");
  }
}

async function refreshStarredCount() {
  try {
    const res = await api("/api/starred");
    const count = Number(res.count || 0);
    const badge = $("#sidebarStarredCount");
    if (badge) {
      badge.textContent = count;
      badge.classList.toggle("has-count", count > 0);
    }
  } catch {}
}

// --- 1. 回收站逻辑 ---
function exitTrashMode() {
  state.trashMode = false;
  state.selectedPaths.clear();
  state.selectionMode = false;
  updateSelectionUi();
  syncSelectionRows();
  syncAiGlobalBtnUi();
  const uploadBtn = $("#uploadBtn");
  const newFolderBtn = $("#newFolderBtn");
  const selectModeBtn = $("#selectModeBtn");
  if (uploadBtn) uploadBtn.classList.remove("hidden");
  if (newFolderBtn) newFolderBtn.classList.remove("hidden");
  if (selectModeBtn) selectModeBtn.classList.remove("hidden");
  const trashClearBtn = document.getElementById("trashClearBtn");
  if (trashClearBtn) {
    trashClearBtn.classList.add("hidden");
    trashClearBtn.remove();
  }
  if (normalSelectionActions) normalSelectionActions.classList.remove("hidden");
  if (trashSelectionActions) trashSelectionActions.classList.add("hidden");
}

async function loadTrash(options = {}) {
  exitStarredMode();
  state.trashMode = true;
  state.searchActive = false;
  if (!options?.preserveSelection) {
    state.selectedPaths.clear();
    state.selectionMode = false;
    state.lastAnchorKey = "";
  }
  updateSelectionUi();
  syncAiGlobalBtnUi();

  const uploadBtn = $("#uploadBtn");
  const newFolderBtn = $("#newFolderBtn");
  const selectModeBtn = $("#selectModeBtn");
  if (uploadBtn) uploadBtn.classList.add("hidden");
  if (newFolderBtn) newFolderBtn.classList.add("hidden");
  if (selectModeBtn) selectModeBtn.classList.remove("hidden");

  let trashClearBtn = document.getElementById("trashClearBtn");
  if (!trashClearBtn) {
    trashClearBtn = document.createElement("button");
    trashClearBtn.id = "trashClearBtn";
    trashClearBtn.className = "danger";
    trashClearBtn.textContent = "清空回收站";
    trashClearBtn.type = "button";
    trashClearBtn.addEventListener("click", clearAllTrash);
    const actionsParent = $(".topbar .actions");
    if (actionsParent) actionsParent.prepend(trashClearBtn);
  } else {
    trashClearBtn.classList.remove("hidden");
  }

  if (currentFolderLabel) currentFolderLabel.textContent = "🗑️ 回收站";
  backBtn.disabled = false;
  renderBreadcrumb();
  if (!options?.silent) setStatus("正在加载回收站...");

  try {
    const res = await api("/api/trash");
    state.items = (res.items || []).map((item) => {
      const isDir = Boolean(item.isDirectory || item.type === "folder");
      return {
        ...item,
        type: isDir ? "folder" : "file",
        isDirectory: isDir,
        size: isDir ? null : item.size,
        path: item.id || item.trashId,
      };
    });
    if (trashClearBtn) trashClearBtn.disabled = state.items.length === 0;
    renderRows({ noAnimation: true });
    if (!options?.silent) setStatus(`回收站共有 ${state.items.length} 个项目，将在30天后自动清除。`);
  } catch (err) {
    if (!options?.silent) setStatus("加载回收站失败: " + err.message);
  }
}

async function clearAllTrash() {
  const ok = await showConfirmDialog("清空回收站", "确认清空回收站中的所有项目吗？清空后所有文件将被彻底删除且无法找回。");
  if (!ok) return;
  try {
    suppressNextRealtimeRefresh();
    const res = await api("/api/trash/clear", { method: "POST" });
    setStatus(res.message || "回收站已清空");
    clearSelection();
    scheduleStorageUsageRefresh({ force: true });
    await loadTrash();
  } catch (err) {
    showErrorDialog(err.message || "清空回收站失败");
  }
}

async function bulkRestoreSelectedTrash() {
  const items = state.items.filter((item) => state.selectedPaths.has(item.path || item.id || item.trashId));
  if (!items.length) return;
  const ids = items.map((item) => item.id || item.trashId);
  try {
    setStatus(`正在批量还原 ${ids.length} 个项目...`);
    suppressNextRealtimeRefresh();
    const res = await api("/api/trash/restore", {
      method: "POST",
      body: JSON.stringify({ ids }),
    });
    const successCount = res.successCount != null ? res.successCount : ids.length;
    setStatus(res.message || `成功还原 ${successCount} 个项目`);
    clearSelection();
    clearFolderCaches();
    scheduleStorageUsageRefresh({ force: true });
    await loadTrash();
  } catch (err) {
    showErrorDialog("批量还原失败: " + err.message);
  }
}

async function bulkPermanentDeleteSelectedTrash() {
  const items = state.items.filter((item) => state.selectedPaths.has(item.path || item.id || item.trashId));
  if (!items.length) return;
  const ids = items.map((item) => item.id || item.trashId);
  const ok = await showConfirmDialog(
    "一键彻底删除",
    `确认永久删除选中的 ${ids.length} 个项目吗？此操作无法撤销，文件将无法找回。`
  );
  if (!ok) return;
  try {
    setStatus(`正在彻底删除 ${ids.length} 个项目...`);
    suppressNextRealtimeRefresh();
    const res = await api("/api/trash/permanent", {
      method: "POST",
      body: JSON.stringify({ ids }),
    });
    const successCount = res.successCount != null ? res.successCount : ids.length;
    setStatus(res.message || `已彻底删除 ${successCount} 个项目`);
    clearSelection();
    scheduleStorageUsageRefresh({ force: true });
    await loadTrash();
  } catch (err) {
    showErrorDialog("批量删除失败: " + err.message);
  }
}

// --- 2. ZIP 压缩包在线浏览（仅支持整体下载，条目只浏览/查看，不显示单文件下载） ---
function isPreviewableArchiveEntry(filename) {
  const ext = (filename.split(".").pop() || "").toLowerCase();
  return /^(txt|md|markdown|json|js|ts|py|c|cpp|h|hpp|java|html|htm|css|xml|yaml|yml|ini|conf|sh|bat|ps1|log|tex|bst|bib|sql|csv|tsv|r|lua|go|rs|png|jpe?g|gif|webp|svg|bmp|ico|pdf)$/i.test(ext);
}

async function previewZipEntry(item, entry) {
  const targetEntry = entry.path || entry.name;
  const ext = (entry.name || targetEntry).split(".").pop().toLowerCase();
  const entryUrl = authUrl(`/api/archive/entry?path=${encodeURIComponent(item.path)}&entry=${encodeURIComponent(targetEntry)}`);

  if (!previewModal) return;
  previewTitle.textContent = `[压缩包内查看] ${entry.name || targetEntry}`;
  previewBody.innerHTML = '<div style="padding:28px;text-align:center;color:var(--text-secondary);">正在加载文件内容...</div>';
  
  // 严格隐藏下载链接和AI总结按钮，遵守“不能单独下载文件，只能下载整个压缩包”的要求
  if (previewDownloadLink) previewDownloadLink.classList.add("hidden");
  if (previewAiSummarizeBtn) previewAiSummarizeBtn.classList.add("hidden");
  clearImagePreviewControls();
  previewModal.classList.remove("hidden");
  previewModal.setAttribute("aria-hidden", "false");

  try {
    const isImg = /^(png|jpe?g|gif|webp|svg|bmp|ico)$/i.test(ext);
    const isPdf = /^pdf$/i.test(ext);

    if (isImg) {
      const img = document.createElement("img");
      img.src = entryUrl;
      img.alt = entry.name;
      img.style.maxWidth = "100%";
      img.style.maxHeight = "70vh";
      img.style.objectFit = "contain";
      img.style.display = "block";
      img.style.margin = "0 auto";
      previewBody.innerHTML = "";
      previewBody.append(img);
    } else if (isPdf) {
      const iframe = document.createElement("iframe");
      iframe.src = entryUrl;
      iframe.title = entry.name;
      iframe.style.width = "100%";
      iframe.style.height = "70vh";
      iframe.style.border = "none";
      previewBody.innerHTML = "";
      previewBody.append(iframe);
    } else {
      const res = await fetch(entryUrl);
      if (!res.ok) throw new Error(`加载失败 HTTP ${res.status}`);
      const text = await res.text();
      const pre = document.createElement("pre");
      pre.style.padding = "16px";
      pre.style.overflow = "auto";
      pre.style.maxHeight = "65vh";
      pre.style.fontFamily = "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";
      pre.style.fontSize = "13px";
      pre.style.lineHeight = "1.6";
      pre.style.background = "#f8fafc";
      pre.style.color = "#0f172a";
      pre.style.borderRadius = "8px";
      pre.style.border = "1px solid #cbd5e1";
      pre.style.whiteSpace = "pre-wrap";
      pre.style.wordBreak = "break-all";
      pre.textContent = text;
      previewBody.innerHTML = "";
      previewBody.append(pre);
    }
  } catch (err) {
    previewBody.innerHTML = `<div style="padding:24px;text-align:center;color:var(--danger, #ff4d4f);">无法预览该文件内容: ${escapeHtml(err.message)}</div>`;
  }
}

let currentZipItem = null;
let currentZipEntries = [];
let currentZipFolder = "";

function getZipFolderContents(allEntries, currentFolder) {
  const normCurrent = String(currentFolder || "").replace(/^\/+|\/+$/g, "");
  const prefix = normCurrent ? normCurrent + "/" : "";

  const subfolders = new Map();
  const files = [];

  for (const entry of allEntries) {
    const rawPath = String(entry.path || "").replace(/\\/g, "/");
    const normPath = rawPath.replace(/^\/+/, "");
    if (prefix && !normPath.startsWith(prefix)) {
      continue;
    }
    const rel = normPath.slice(prefix.length).replace(/\/+$/, "");
    if (!rel) continue;

    const parts = rel.split("/");
    if (parts.length === 1) {
      if (entry.isDirectory) {
        if (!subfolders.has(parts[0])) {
          subfolders.set(parts[0], {
            name: parts[0],
            path: prefix + parts[0],
            isDirectory: true,
          });
        }
      } else {
        files.push({
          ...entry,
          name: parts[0],
          path: entry.path,
        });
      }
    } else {
      if (!subfolders.has(parts[0])) {
        subfolders.set(parts[0], {
          name: parts[0],
          path: prefix + parts[0],
          isDirectory: true,
        });
      }
    }
  }

  const folderList = Array.from(subfolders.values()).map((folder) => {
    const folderPrefix = folder.path + "/";
    let count = 0;
    for (const e of allEntries) {
      const p = String(e.path || "").replace(/\\/g, "/").replace(/^\/+/, "");
      if (p.startsWith(folderPrefix) && p !== folderPrefix) count++;
    }
    return { ...folder, itemCount: count };
  }).sort((a, b) => a.name.localeCompare(b.name, "zh-CN"));

  const fileList = files.sort((a, b) => a.name.localeCompare(b.name, "zh-CN"));

  return { folders: folderList, files: fileList };
}

function renderZipFolder(folderPath) {
  const cleanPath = String(folderPath || "").replace(/^\/+|\/+$/g, "");
  currentZipFolder = cleanPath;

  // 1. 渲染面包屑导航栏
  if (zipBreadcrumb) {
    zipBreadcrumb.innerHTML = "";

    const rootLink = document.createElement("span");
    rootLink.className = `zip-breadcrumb-item ${cleanPath === "" ? "current" : ""}`;
    rootLink.textContent = "🏠 根目录";
    if (cleanPath !== "") {
      rootLink.onclick = () => renderZipFolder("");
    }
    zipBreadcrumb.append(rootLink);

    if (cleanPath !== "") {
      const parts = cleanPath.split("/").filter(Boolean);
      let cumulative = "";
      parts.forEach((part, index) => {
        cumulative += (cumulative ? "/" : "") + part;
        const targetPath = cumulative;

        const sep = document.createElement("span");
        sep.className = "zip-breadcrumb-separator";
        sep.textContent = "/";
        zipBreadcrumb.append(sep);

        const partSpan = document.createElement("span");
        const isCurrent = index === parts.length - 1;
        partSpan.className = `zip-breadcrumb-item ${isCurrent ? "current" : ""}`;
        partSpan.textContent = part;
        if (!isCurrent) {
          partSpan.onclick = () => renderZipFolder(targetPath);
        }
        zipBreadcrumb.append(partSpan);
      });
    }
  }

  // 2. 控制“返回上一级”按钮
  if (zipBackBtn) {
    if (!cleanPath) {
      zipBackBtn.classList.add("hidden");
    } else {
      zipBackBtn.classList.remove("hidden");
      const parentPath = cleanPath.includes("/") ? cleanPath.slice(0, cleanPath.lastIndexOf("/")) : "";
      zipBackBtn.onclick = () => renderZipFolder(parentPath);
    }
  }

  // 3. 渲染当前目录下的文件夹与文件
  if (!zipTreeContainer) return;
  const { folders, files } = getZipFolderContents(currentZipEntries, cleanPath);

  if (!folders.length && !files.length) {
    zipTreeContainer.innerHTML = '<div style="padding:32px;text-align:center;color:var(--text-secondary,#64748b);">此文件夹为空</div>';
    return;
  }

  zipTreeContainer.innerHTML = "";

  // 渲染子文件夹（点击可直接打开进入）
  folders.forEach((folder) => {
    const row = document.createElement("div");
    row.className = "zip-entry-row is-folder";
    row.title = `点击进入文件夹：${folder.name}`;
    row.onclick = () => renderZipFolder(folder.path);

    const info = document.createElement("div");
    info.className = "zip-entry-info";

    const icon = document.createElement("span");
    icon.textContent = "📁";
    const name = document.createElement("span");
    name.className = "zip-entry-name";
    name.textContent = folder.name + "/";
    info.append(icon, name);

    if (folder.itemCount > 0) {
      const meta = document.createElement("span");
      meta.className = "zip-entry-size";
      meta.textContent = `${folder.itemCount} 项`;
      info.append(meta);
    }

    const actions = document.createElement("div");
    actions.className = "zip-entry-actions";

    const openBtn = document.createElement("button");
    openBtn.type = "button";
    openBtn.className = "ghost compact";
    openBtn.textContent = "📂 进入";
    openBtn.onclick = (e) => {
      e.stopPropagation();
      renderZipFolder(folder.path);
    };
    actions.append(openBtn);

    row.append(info, actions);
    zipTreeContainer.append(row);
  });

  // 渲染文件（支持查看/预览，不提供单文件下载）
  files.forEach((file) => {
    const row = document.createElement("div");
    row.className = "zip-entry-row";

    const info = document.createElement("div");
    info.className = "zip-entry-info";

    const icon = document.createElement("span");
    icon.textContent = "📄";
    const name = document.createElement("span");
    name.className = "zip-entry-name";
    name.textContent = file.name;
    name.title = file.name;
    info.append(icon, name);

    if (file.size != null) {
      const size = document.createElement("span");
      size.className = "zip-entry-size";
      size.textContent = formatSize(file.size);
      info.append(size);
    }

    const canView = isPreviewableArchiveEntry(file.name);
    const actions = document.createElement("div");
    actions.className = "zip-entry-actions";

    if (canView) {
      const viewBtn = document.createElement("button");
      viewBtn.type = "button";
      viewBtn.className = "ghost compact";
      viewBtn.textContent = "👁️ 查看";
      viewBtn.title = "在线查看文件内容（不能单独下载，只能下载整个压缩包）";
      viewBtn.onclick = (e) => {
        e.stopPropagation();
        previewZipEntry(currentZipItem, file);
      };
      actions.append(viewBtn);

      row.style.cursor = "pointer";
      row.title = "点击在线查看文件内容";
      row.onclick = () => previewZipEntry(currentZipItem, file);
    }

    row.append(info, actions);
    zipTreeContainer.append(row);
  });
}

async function openZipArchiveModal(item) {
  if (!zipArchiveModal) return;
  currentZipItem = item;
  currentZipFolder = "";
  zipArchiveModal.classList.remove("hidden");
  zipArchiveModal.setAttribute("aria-hidden", "false");
  if (zipArchiveTitle) zipArchiveTitle.textContent = `压缩包内容：${itemName(item)}`;
  if (zipDownloadAllBtn) zipDownloadAllBtn.onclick = () => downloadFile(item);
  if (zipBackBtn) zipBackBtn.classList.add("hidden");
  if (zipBreadcrumb) zipBreadcrumb.innerHTML = '<span class="zip-breadcrumb-item current">🏠 正在读取压缩包...</span>';
  if (zipTreeContainer) {
    zipTreeContainer.innerHTML = '<div class="zip-loading" style="padding:28px;text-align:center;color:var(--text-secondary);">📦 正在读取 ZIP 压缩包目录结构，请稍候...</div>';
  }

  try {
    const data = await api(`/api/archive/tree?path=${encodeURIComponent(item.path)}`);
    currentZipEntries = data.entries || [];
    renderZipFolder("");
  } catch (err) {
    if (zipTreeContainer) {
      zipTreeContainer.innerHTML = `<div style="padding:24px;text-align:center;color:var(--danger, #ff4d4f);">读取压缩包失败: ${escapeHtml(err.message)}</div>`;
    }
  }
}

// --- 3. 外链分享 ---
let currentSharingItem = null;
let currentSharingItems = [];

async function copyTextWithFeedback(button, text) {
  let ok = false;
  // 1. 尝试现代 Clipboard API（仅在安全上下文 HTTPS 或 localhost 下可用）
  if (navigator.clipboard?.writeText && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      ok = true;
    } catch {}
  }

  // 2. 局域网 HTTP（如 192.168.x.x）及备选兼容方案：使用临时不可见文本域复制完整的 text
  if (!ok) {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.top = "0";
      ta.style.left = "-9999px";
      ta.style.width = "2em";
      ta.style.height = "2em";
      ta.style.padding = "0";
      ta.style.border = "none";
      ta.style.outline = "none";
      ta.style.boxShadow = "none";
      ta.style.background = "transparent";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      ta.setSelectionRange(0, ta.value.length);
      ok = document.execCommand("copy");
      ta.remove();
    } catch (e) {
      console.warn("Copy fallback failed:", e);
    }
  }

  if (button) {
    const original = button.textContent;
    button.textContent = ok ? "✅ 已复制！" : "❌ 复制失败";
    setTimeout(() => { button.textContent = original; }, 2000);
  }
  return ok;
}

function openShareModal(target) {
  if (!shareModal) return;
  const items = Array.isArray(target) ? target : (target ? [target] : []);
  if (!items.length) return;
  currentSharingItems = items;
  currentSharingItem = items[0];

  const isBatch = items.length > 1;

  shareModal.classList.remove("hidden");
  shareModal.setAttribute("aria-hidden", "false");

  if (shareModalTitle) {
    shareModalTitle.textContent = isBatch ? `批量创建外链分享 (${items.length}项)` : "创建外链分享";
  }

  if (shareItemName) {
    if (isBatch) {
      const namesPreview = items.slice(0, 3).map((it) => itemName(it)).join("、");
      const more = items.length > 3 ? ` 等共 ${items.length} 个项目` : "";
      shareItemName.textContent = `已选择：${namesPreview}${more}`;
      shareItemName.title = items.map((it) => itemName(it)).join("\n");
    } else {
      shareItemName.textContent = `正在分享：${itemName(items[0])}`;
      shareItemName.title = itemName(items[0]);
    }
  }

  if (shareExpireDays) {
    shareExpireDays.value = "7";
    shareExpireDays.disabled = false;
  }
  if (sharePasswordInput) {
    sharePasswordInput.value = "";
    sharePasswordInput.disabled = false;
  }
  if (shareResultPanel) shareResultPanel.classList.add("hidden");
  if (shareBatchList) {
    shareBatchList.innerHTML = "";
    shareBatchList.classList.add("hidden");
  }
  if (shareResultLink) shareResultLink.value = "";
  if (sharePublicLink) sharePublicLink.value = "";
  if (shareLanLink) shareLanLink.value = "";
  if (cancelShareBtn) cancelShareBtn.classList.remove("hidden");
  if (createShareBtn) {
    createShareBtn.disabled = false;
    createShareBtn.textContent = "生成分享链接";
    createShareBtn.classList.remove("hidden");
  }
  if (shareDoneBtn) {
    shareDoneBtn.classList.add("hidden");
  }
}

async function handleCreateShare() {
  const items = currentSharingItems && currentSharingItems.length ? currentSharingItems : (currentSharingItem ? [currentSharingItem] : []);
  if (!items.length) return;
  if (!createShareBtn) return;
  createShareBtn.disabled = true;
  createShareBtn.textContent = "正在生成...";

  try {
    const expireDays = Number(shareExpireDays ? shareExpireDays.value : 7) || 0;
    const password = sharePasswordInput ? sharePasswordInput.value.trim() : "";
    const isBatch = items.length > 1;

    const payload = isBatch
      ? { paths: items.map((it) => it.path), expireDays, password }
      : { path: items[0].path, expireDays, password };

    const res = await api("/api/shares", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    const share = res.share;
    const publicBase = (res.publicBaseUrl || window.location.origin).replace(/\/+$/, "");
    let lanBase = (res.lanBaseUrl || "").replace(/\/+$/, "");
    if (!lanBase && isLanHost(window.location.hostname)) {
      lanBase = `${window.location.protocol}//${window.location.host}`.replace(/\/+$/, "");
    }
    const publicUrl = `${publicBase}/s/${share.id}`;
    const lanUrl = lanBase ? `${lanBase}/s/${share.id}` : `${window.location.origin}/s/${share.id}`;

    if (sharePublicLink) sharePublicLink.value = publicUrl;
    if (shareLanLink) shareLanLink.value = lanUrl;
    if (shareResultLink) shareResultLink.value = publicUrl;
    if (shareResultPanel) shareResultPanel.classList.remove("hidden");
    if (shareExpireDays) shareExpireDays.disabled = true;
    if (sharePasswordInput) sharePasswordInput.disabled = true;

    // 已经生成成功：隐藏“生成分享链接”和“取消”按钮，显示独立的“完成”按钮
    if (cancelShareBtn) cancelShareBtn.classList.add("hidden");
    if (createShareBtn) {
      createShareBtn.disabled = false;
      createShareBtn.textContent = "生成分享链接";
      createShareBtn.classList.add("hidden");
    }
    if (shareDoneBtn) {
      shareDoneBtn.classList.remove("hidden");
    }

    const pwdText = password ? `\n提取码：${password}` : "";

    if (!isBatch) {
      // 单文件/文件夹分享
      const first = items[0];
      const firstName = itemName(first);
      if (shareBatchList) {
        shareBatchList.classList.add("hidden");
        shareBatchList.innerHTML = "";
      }

      if (copyPublicLinkBtn) {
        copyPublicLinkBtn.onclick = async () => {
          const textToCopy = `【DPSir 智云盘分享 · 公网外链】\n文件：${firstName}\n链接：${publicUrl}${pwdText}`;
          await copyTextWithFeedback(copyPublicLinkBtn, textToCopy);
        };
      }

      if (copyLanLinkBtn) {
        copyLanLinkBtn.onclick = async () => {
          const textToCopy = `【DPSir 智云盘分享 · 局域网内网】\n文件：${firstName}\n链接：${lanUrl}${pwdText}`;
          await copyTextWithFeedback(copyLanLinkBtn, textToCopy);
        };
      }

      if (copyShareLinkBtn) {
        copyShareLinkBtn.onclick = async () => {
          const textToCopy = `【DPSir 智云盘分享】\n文件：${firstName}\n🌐 公网链接：${publicUrl}\n🏠 局域网链接：${lanUrl}${pwdText}`;
          await copyTextWithFeedback(copyShareLinkBtn, textToCopy);
        };
      }
      setStatus("外链分享创建成功！");
    } else {
      // 批量多项目单链接分享
      const itemsListText = items.map((it, idx) => `  ${idx + 1}. ${it.type === "folder" || it.isDirectory ? "📁" : "📄"} ${itemName(it)}`).join("\n");

      if (copyPublicLinkBtn) {
        copyPublicLinkBtn.onclick = async () => {
          const textToCopy = `【DPSir 智云盘分享 · 公网外链】\n内容：${share.name}（包含 ${items.length} 个项目）\n链接：${publicUrl}${pwdText}`;
          await copyTextWithFeedback(copyPublicLinkBtn, textToCopy);
        };
      }

      if (copyLanLinkBtn) {
        copyLanLinkBtn.onclick = async () => {
          const textToCopy = `【DPSir 智云盘分享 · 局域网内网】\n内容：${share.name}（包含 ${items.length} 个项目）\n链接：${lanUrl}${pwdText}`;
          await copyTextWithFeedback(copyLanLinkBtn, textToCopy);
        };
      }

      if (copyShareLinkBtn) {
        copyShareLinkBtn.onclick = async () => {
          const textToCopy = `【DPSir 智云盘分享】\n内容：${share.name}\n包含项目：\n${itemsListText}\n🌐 公网链接：${publicUrl}\n🏠 局域网链接：${lanUrl}${pwdText}`;
          await copyTextWithFeedback(copyShareLinkBtn, textToCopy);
        };
      }

      // 渲染本次单一分享链接包含的项目清单列表（简洁清晰预览）
      if (shareBatchList) {
        shareBatchList.innerHTML = `<div style="font-size:12px;color:var(--text-secondary,#64748b);font-weight:600;margin-bottom:4px;">📦 本次分享包含以下 ${items.length} 个项目：</div>`;
        for (const it of items) {
          const rowEl = document.createElement("div");
          rowEl.className = "share-batch-item";

          const nameEl = document.createElement("span");
          nameEl.className = "share-batch-item-name";
          const isDir = it.type === "folder" || it.isDirectory;
          nameEl.textContent = (isDir ? "📁 " : "📄 ") + itemName(it);
          nameEl.title = itemName(it);

          const metaEl = document.createElement("span");
          metaEl.className = "share-batch-item-meta";
          metaEl.textContent = isDir ? "文件夹" : (it.size != null ? formatSize(it.size) : "");

          rowEl.appendChild(nameEl);
          if (metaEl.textContent) rowEl.appendChild(metaEl);
          shareBatchList.appendChild(rowEl);
        }
        shareBatchList.classList.remove("hidden");
      }
      setStatus(`已成功创建批量外链分享（共包含 ${items.length} 项）！`);
    }
  } catch (err) {
    if (createShareBtn) {
      createShareBtn.disabled = false;
      createShareBtn.textContent = "生成分享链接";
      createShareBtn.classList.remove("hidden");
    }
    if (shareDoneBtn) shareDoneBtn.classList.add("hidden");
    if (cancelShareBtn) cancelShareBtn.classList.remove("hidden");
    showErrorDialog("创建分享失败: " + err.message);
  }
}

async function loadMyShares() {
  if (!mySharesList) return;
  mySharesList.innerHTML = '<div style="padding:20px;text-align:center;color:var(--text-secondary);">正在加载分享列表...</div>';
  try {
    const res = await api("/api/shares");
    const shares = res.shares || [];
    if (!shares.length) {
      mySharesList.innerHTML = '<div style="padding:32px;text-align:center;color:var(--text-secondary);">暂无任何活跃的分享外链</div>';
      return;
    }
    mySharesList.innerHTML = "";

    const publicBase = (res.publicBaseUrl || window.location.origin).replace(/\/+$/, "");
    let lanBase = (res.lanBaseUrl || "").replace(/\/+$/, "");
    if (!lanBase && isLanHost(window.location.hostname)) {
      lanBase = `${window.location.protocol}//${window.location.host}`.replace(/\/+$/, "");
    }

    shares.forEach((share) => {
      const card = document.createElement("div");
      card.className = "my-share-card";

      const info = document.createElement("div");
      info.className = "my-share-info";

      const name = document.createElement("strong");
      name.textContent = share.name;
      name.title = share.name;

      const meta = document.createElement("small");
      const expireText = share.expiresAt ? `有效期至：${new Date(share.expiresAt).toLocaleDateString()}` : "永久有效";
      const lockText = share.hasPassword ? "🔒 需提取码" : "🌐 公开访问";
      meta.textContent = `${lockText} · ${expireText} · 访问次数：${share.downloads || share.accessCount || 0}`;

      info.append(name, meta);

      const ops = document.createElement("div");
      ops.style.display = "flex";
      ops.style.gap = "8px";
      ops.style.alignItems = "center";
      ops.style.flexWrap = "wrap";

      const publicUrl = `${publicBase}/s/${share.id}`;
      const lanUrl = lanBase ? `${lanBase}/s/${share.id}` : `${window.location.origin}/s/${share.id}`;

      const copyPublicBtn = document.createElement("button");
      copyPublicBtn.type = "button";
      copyPublicBtn.className = "ghost compact";
      copyPublicBtn.textContent = "🌐 复制公网";
      copyPublicBtn.title = `复制公网链接：${publicUrl}`;
      copyPublicBtn.onclick = () => copyTextWithFeedback(copyPublicBtn, publicUrl);

      const copyLanBtn = document.createElement("button");
      copyLanBtn.type = "button";
      copyLanBtn.className = "ghost compact";
      copyLanBtn.textContent = "🏠 复制局域网";
      copyLanBtn.title = `复制局域网链接：${lanUrl}`;
      copyLanBtn.onclick = () => copyTextWithFeedback(copyLanBtn, lanUrl);

      const delBtn = document.createElement("button");
      delBtn.type = "button";
      delBtn.className = "danger compact";
      delBtn.textContent = "取消分享";
      delBtn.onclick = async () => {
        const ok = await showConfirmDialog("取消分享", `确认关闭针对“${share.name}”的分享链接吗？\n取消后该链接将立即彻底失效，无法再被任何人访问。`);
        if (!ok) return;
        try {
          await api(`/api/shares/${encodeURIComponent(share.id)}`, { method: "DELETE" });
          setStatus("已取消该分享，外链已立即失效");
          await loadMyShares();
        } catch (err) {
          showErrorDialog(err.message || "取消分享失败");
        }
      };

      ops.append(copyPublicBtn, copyLanBtn, delBtn);
      card.append(info, ops);
      mySharesList.append(card);
    });
  } catch (err) {
    if (mySharesList) {
      mySharesList.innerHTML = `<div style="padding:20px;text-align:center;color:var(--danger,#ff4d4f);">加载分享失败: ${escapeHtml(err.message)}</div>`;
    }
  }
}

// --- 4. DeepSeek AI 文档智能总结 (SSE 极速流式打字机) ---
let currentAiDocSummaryAbortController = null;

function closeAiDocSummaryModal() {
  if (currentAiDocSummaryAbortController) {
    currentAiDocSummaryAbortController.abort();
    currentAiDocSummaryAbortController = null;
  }
  if (aiDocSummaryModal) {
    aiDocSummaryModal.classList.add("hidden");
    aiDocSummaryModal.setAttribute("aria-hidden", "true");
  }
}

async function openAiDocSummaryModal(item, options = {}) {
  if (!aiDocSummaryModal) return;
  if (currentAiDocSummaryAbortController) {
    currentAiDocSummaryAbortController.abort();
    currentAiDocSummaryAbortController = null;
  }
  const abortController = new AbortController();
  currentAiDocSummaryAbortController = abortController;
  const isForce = Boolean(options && options.force);
  const ext = fileExt(item.name);
  const isImage = ["jpg", "jpeg", "png", "webp", "bmp", "tif", "tiff"].includes(ext);
  const isTable = ["xlsx", "xls", "csv", "tsv"].includes(ext);

  let summaryTitle = `DeepSeek 智能总结：${itemName(item)}`;
  let initialStatus = isForce ? "正在重新提炼..." : "正在极速提炼文档并连接 DeepSeek...";
  let loadingTitle = "正在由 DeepSeek-V4.1-Flash 极速分析提炼...";
  let loadingSub = "首字秒级极速响应，实时流式输出";

  if (isImage) {
    summaryTitle = `DeepSeek 智能图文总结：${itemName(item)}`;
    initialStatus = isForce ? "正在重新进行 OCR 图文识别与提炼..." : "正在进行 OCR 图文识别与分析...";
    loadingTitle = "正在进行 OCR 图文识别与 DeepSeek 深度分析...";
    loadingSub = "智能提取图片文字与核心信息，实时流式呈现";
  } else if (isTable) {
    summaryTitle = `DeepSeek 表格智能分析：${itemName(item)}`;
    initialStatus = isForce ? "正在重新解析表格数据并分析..." : "正在解析多维表格数据与指标...";
    loadingTitle = "正在深度解析表格结构与数据趋势...";
    loadingSub = "多工作表维度拆解与核心数据洞察提炼";
  }

  aiDocSummaryModal.classList.remove("hidden");
  aiDocSummaryModal.setAttribute("aria-hidden", "false");
  if (aiDocSummaryTitle) {
    aiDocSummaryTitle.textContent = summaryTitle;
  }
  if (aiDocSummaryBody) {
    aiDocSummaryBody.innerHTML = `
      <div class="ai-summary-container">
        <div class="ai-summary-statusbar" id="aiDocSummaryStatusBar">
          <span class="ai-summary-badge" id="aiDocSummaryBadge">
            <span class="ai-summary-pulse-dot"></span>
            <span id="aiDocSummaryStatusText">${initialStatus}</span>
          </span>
          <div class="ai-summary-actions">
            <button class="copy-summary-btn hidden" id="retryAiDocSummaryActionBtn" type="button" title="重新生成总结">
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
              </svg>
              <span>重新生成</span>
            </button>
            <button class="copy-summary-btn hidden" id="copyAiDocSummaryBtn" type="button" title="复制总结全文">
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
              <span id="copyAiDocSummaryBtnText">复制总结</span>
            </button>
          </div>
        </div>
        <div id="aiDocSummaryStreamContent" class="ai-markdown ai-summary-content">
          <div class="ai-summary-loading">
            <div style="text-align:center;">
              <div style="font-size:24px;margin-bottom:8px;">⚡</div>
              <p style="margin:0;font-weight:600;">${loadingTitle}</p>
              <small style="opacity:0.75;margin-top:6px;display:block;">${loadingSub}</small>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  const statusTextElem = document.getElementById("aiDocSummaryStatusText");
  const badgeElem = document.getElementById("aiDocSummaryBadge");
  const contentElem = document.getElementById("aiDocSummaryStreamContent");
  const retryActionBtn = document.getElementById("retryAiDocSummaryActionBtn");
  const copyBtn = document.getElementById("copyAiDocSummaryBtn");
  const copyBtnText = document.getElementById("copyAiDocSummaryBtnText");

  if (retryActionBtn) {
    retryActionBtn.onclick = () => openAiDocSummaryModal(item, { force: true });
  }

  let fullContent = "";
  let fullReasoning = "";
  let renderScheduled = false;

  function scheduleRender(isFinal = false) {
    if (renderScheduled && !isFinal) return;
    renderScheduled = true;
    requestAnimationFrame(() => {
      renderScheduled = false;
      if (!contentElem) return;
      if (!fullContent && !fullReasoning) return;

      const existingThoughtBox = contentElem.querySelector(".ai-thought-box");
      const wasUserOpened = existingThoughtBox ? existingThoughtBox.open : false;

      const rendered = renderAiMarkdown(fullContent, fullReasoning);
      const thoughtBox = rendered.querySelector(".ai-thought-box");
      if (thoughtBox) {
        thoughtBox.open = wasUserOpened;
      }

      contentElem.replaceChildren(...rendered.childNodes);

      if (!fullContent && fullReasoning) {
        const waitingNode = document.createElement("div");
        waitingNode.className = "ai-summary-thinking-placeholder";
        waitingNode.style.padding = "14px 4px";
        waitingNode.style.color = "#94a3b8";
        waitingNode.style.fontSize = "13px";
        waitingNode.innerHTML = `<span class="ai-summary-pulse-dot" style="display:inline-block;vertical-align:middle;margin-right:6px;"></span> 思考完毕，正在生成总结结果...`;
        contentElem.append(waitingNode);
      }

      if (isFinal) {
        renderMathInAiMessage(contentElem);
      }
    });
  }

  try {
    const token = sessionToken();
    const response = await fetch("/api/ai/summarize-doc", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "text/event-stream",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ path: item.path, stream: true, force: isForce }),
      signal: abortController.signal,
    });

    if (!response.ok) {
      let errMsg = `请求失败 (${response.status})`;
      try {
        const errJson = await response.json();
        if (errJson.error) errMsg = errJson.error;
      } catch {}
      throw new Error(errMsg);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data:")) continue;
        const jsonStr = trimmed.slice(5).trim();
        if (!jsonStr) continue;

        try {
          const msg = JSON.parse(jsonStr);
          if (msg.type === "start") {
            if (statusTextElem) {
              statusTextElem.textContent = msg.cached
                ? `⚡ 已加载历史提炼缓存`
                : (msg.message || `DeepSeek-V4.1-Flash 正在极速提炼《${msg.docName || itemName(item)}》...`);
            }
          } else if (msg.type === "status") {
            if (statusTextElem) statusTextElem.textContent = msg.message || "正在生成总结...";
          } else if (msg.type === "chunk") {
            fullContent += msg.content || "";
            scheduleRender(false);
          } else if (msg.type === "reasoning") {
            fullReasoning += msg.content || "";
            scheduleRender(false);
          } else if (msg.type === "done") {
            if (msg.fullSummary && !fullContent) fullContent = msg.fullSummary;
            if (msg.fullReasoning && !fullReasoning) fullReasoning = msg.fullReasoning;
          } else if (msg.type === "error") {
            throw new Error(msg.error || "AI 总结异常");
          }
        } catch (e) {
          if (e.message && !e.message.startsWith("Unexpected")) {
            throw e;
          }
        }
      }
    }

    scheduleRender(true);

    if (badgeElem) {
      badgeElem.classList.add("done");
      if (statusTextElem) statusTextElem.textContent = "✨ 极速提炼完毕 (DeepSeek-V4.1-Flash)";
    }
    if (retryActionBtn) {
      retryActionBtn.classList.remove("hidden");
    }
    if (copyBtn) {
      copyBtn.classList.remove("hidden");
      copyBtn.onclick = async () => {
        const textToCopy = fullContent || "";
        const ok = await copyTextToClipboard(textToCopy);
        if (ok && copyBtnText) {
          const original = copyBtnText.textContent;
          copyBtnText.textContent = "已复制 ✓";
          setTimeout(() => { copyBtnText.textContent = original; }, 1800);
        }
      };
    }
  } catch (err) {
    if (err.name === "AbortError") return;
    if (aiDocSummaryBody) {
      aiDocSummaryBody.innerHTML = `
        <div style="padding:32px 20px;text-align:center;color:var(--danger, #ff4d4f);">
          <p style="margin-bottom:14px;font-size:15px;font-weight:500;">AI 智能总结失败: ${escapeHtml(err.message)}</p>
          <button class="primary" id="retryAiDocSummaryBtn" type="button" style="padding:8px 18px;border-radius:8px;cursor:pointer;">点击重试</button>
        </div>
      `;
      const retryBtn = document.getElementById("retryAiDocSummaryBtn");
      if (retryBtn) retryBtn.onclick = () => openAiDocSummaryModal(item, { force: true });
    }
  } finally {
    if (currentAiDocSummaryAbortController === abortController) {
      currentAiDocSummaryAbortController = null;
    }
  }
}

// --- 5. 移动端触摸手势导航 ---
let touchStartX = 0;
let touchStartY = 0;
let touchStartTime = 0;

function setupImageSwipeGestures() {
  if (!previewCard) return;
  previewCard.addEventListener("touchstart", (e) => {
    if (e.changedTouches && e.changedTouches.length === 1) {
      touchStartX = e.changedTouches[0].screenX;
      touchStartY = e.changedTouches[0].screenY;
      touchStartTime = Date.now();
    }
  }, { passive: true });

  previewCard.addEventListener("touchend", (e) => {
    if (e.changedTouches && e.changedTouches.length === 1 && state.previewItem && previewKind(state.previewItem.name) === "image") {
      const deltaX = e.changedTouches[0].screenX - touchStartX;
      const deltaY = e.changedTouches[0].screenY - touchStartY;
      const deltaTime = Date.now() - touchStartTime;
      if (Math.abs(deltaX) >= 45 && Math.abs(deltaX) > Math.abs(deltaY) * 1.3 && deltaTime < 700) {
        if (deltaX < 0) {
          switchImagePreview(1);
        } else {
          switchImagePreview(-1);
        }
      }
    }
  }, { passive: true });
}

// 绑定全局触发事件
starredNavBtn?.addEventListener("click", () => {
  if (state.starredMode) {
    exitStarredMode();
    loadFolder(state.path || "");
  } else {
    loadStarred();
  }
});
bulkStarBtn?.addEventListener("click", bulkStarSelected);
recycleBinBtn?.addEventListener("click", loadTrash);
trashSelectAllBtn?.addEventListener("click", toggleAllSelection);
headerSelectAll?.addEventListener("click", toggleAllSelection);
bulkRestoreTrashBtn?.addEventListener("click", bulkRestoreSelectedTrash);
bulkPermanentDeleteBtn?.addEventListener("click", bulkPermanentDeleteSelectedTrash);
clearTrashSelectionBtn?.addEventListener("click", clearSelection);

// 绑定表格行右键上下文菜单事件
fileRows?.addEventListener("contextmenu", (event) => {
  const tr = event.target.closest("tr[data-path]");
  if (!tr) return;
  event.preventDefault();
  event.stopPropagation();
  handleRowContextMenu(event, tr);
});

mySharesBtn?.addEventListener("click", () => {
  mySharesModal?.classList.remove("hidden");
  loadMyShares();
});
closeZipArchiveBtn?.addEventListener("click", () => zipArchiveModal?.classList.add("hidden"));
closeShareModalBtn?.addEventListener("click", () => shareModal?.classList.add("hidden"));
cancelShareBtn?.addEventListener("click", () => shareModal?.classList.add("hidden"));
createShareBtn?.addEventListener("click", handleCreateShare);
shareDoneBtn?.addEventListener("click", () => {
  shareModal?.classList.add("hidden");
  shareModal?.setAttribute("aria-hidden", "true");
});
closeMySharesModalBtn?.addEventListener("click", () => mySharesModal?.classList.add("hidden"));
closeAiDocSummaryModalBtn?.addEventListener("click", closeAiDocSummaryModal);

// 支持新弹窗 ESC 和背景点击关闭
for (const modal of [zipArchiveModal, shareModal, mySharesModal, aiDocSummaryModal]) {
  if (!modal) continue;
  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      if (modal === aiDocSummaryModal) {
        closeAiDocSummaryModal();
      } else {
        modal.classList.add("hidden");
      }
    }
  });
}

setupImageSwipeGestures();
setupAccessBoxCollapsible();

restoreSessionTokenFromUrl();
localStorage.removeItem(AI_MODE_KEY);
state.aiModeEnabled = false;
syncAiModeUi();

api("/api/me")
  .then(async (me) => {
    if (me.authenticated) {
      setSessionToken(me.token || sessionToken());
      await enterDrive(me.user || null);
    } else {
      setSessionToken("");
      state.currentUser = null;
      syncAdminUi();
      loginView.classList.remove("hidden");
    }
  })
  .catch(() => {
    setSessionToken("");
    loginView.classList.remove("hidden");
  });

setAuthMode("login");
