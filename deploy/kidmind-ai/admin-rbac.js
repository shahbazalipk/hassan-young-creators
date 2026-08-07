/** Role-based access for admin panel */
var AdminRBAC = (function () {
  var ROLES = {
    SUPER_ADMIN: "super_admin",
    ADMIN: "admin",
    VIEWER: "viewer"
  };

  var PERMISSIONS = {
    VIEW_DASHBOARD: "view_dashboard",
    MANAGE_QUESTIONS: "manage_questions",
    VIEW_REPORTS: "view_reports",
    MANAGE_USERS: "manage_users",
    TEST_MODE: "test_mode",
    CLEAR_ALL_DATA: "clear_all_data"
  };

  var ROLE_PERMISSIONS = {};
  ROLE_PERMISSIONS[ROLES.SUPER_ADMIN] = [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.MANAGE_QUESTIONS,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.TEST_MODE,
    PERMISSIONS.CLEAR_ALL_DATA
  ];
  ROLE_PERMISSIONS[ROLES.ADMIN] = [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.MANAGE_QUESTIONS,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.TEST_MODE,
    PERMISSIONS.CLEAR_ALL_DATA
  ];
  ROLE_PERMISSIONS[ROLES.VIEWER] = [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_REPORTS
  ];

  function hasPermission(role, permission) {
    var perms = ROLE_PERMISSIONS[role] || [];
    return perms.indexOf(permission) !== -1;
  }

  function getPermissions(role) {
    return ROLE_PERMISSIONS[role] || [];
  }

  return {
    ROLES: ROLES,
    PERMISSIONS: PERMISSIONS,
    hasPermission: hasPermission,
    getPermissions: getPermissions
  };
})();
