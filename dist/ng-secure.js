(function(window, document) {

angular.module('ngSecure',[]);
'use strict';

angular.module('ngSecure').
  factory('AuthInterceptor', ['$q', '$rootScope', 'User', function($q, $rootScope, User) {
    return {
      'request': function(config) {
        if (User.isAuthenticated()) {
          config.headers['X-AuthToken'] = User.getAuthToken();
        }

        return config || $q.when(config);
      },
      'responseError': function(rejection) {
        console.log('rejection', rejection);
        var statusCode = rejection.status;
        var config = rejection.config;

        // Check if authentication is required and has failed or has not yet been provided
        if (statusCode === 401 &&
          rejection.data.code === "unauthorized") {

          // Raise an event
          $rootScope.$broadcast('Auth:Failed');
        }

        return $q.reject(rejection);
      }
    }
  }]).
  service('Security', ['Restangular', '$q' , '$state', 'User', '$rootScope', 'Secure',
    function(Restangular, $q, $state, User, $rootScope, Secure) {
      var self = this;
      var baseAuth = Restangular.all('auths');

      /**
       * Check if the current user is authenticated
       */
      this.loginStatus = function(successCallback, errorCallback, finallyCallback) {
        baseAuth.customGET('is_signed_in').then(function(response) {
            User.setUser(response.auth_token, response.profile);
            (successCallback || angular.noop)(response);
        }, errorCallback || angular.noop).finally(finallyCallback || angular.noop);
      }

      /**
       * Authentication attemp using email and password
       *
       * @param userDetails
       * @param successCallback
       * @param errorCallback
       * @param finallyCallback
       */
      this.emailLogin = function(userDetails, successCallback, errorCallback, finallyCallback) {
        baseAuth.customPOST(userDetails, 'email_sign_in').then(function(response) {
          User.setUser(response.auth_token, response.profile);
          (successCallback || angular.noop)(response);
        }, errorCallback || angular.noop).finally(finallyCallback || angular.noop);
      }

      this.emailSignup = function(userDetails, successCallback, errorCallback, finallyCallback) {
        baseAuth.customPOST(userDetails, 'email_sign_up').then(function(response) {
          User.setUser(response.auth_token, response.profile);
          (successCallback || angular.noop)(response);
        }, errorCallback || angular.noop).finally(finallyCallback || angular.noop);
      }

      /**
       * Executes signup attempt using facebook connect,
       *
       * @param userDetails - Object of the following format:
       * {
       *    access_token: 'aaa',  // Facebook's access token
       *    facebook_id: 'bbb',   // The user's facebook id
       *    zipcode: '123'        // The users's zip code
       * }
       * @param successCallback
       * @param errorCallback
       * @param finallyCallback
       */
      this.facebookSignup = function(userDetails, successCallback, errorCallback, finallyCallback) {
        baseAuth.customPOST(userDetails, 'facebook_sign_up').then(function(response) {
          User.setUser(response.auth_token, response.profile);
          (successCallback || angular.noop)(response);
        }, errorCallback || angular.noop).finally(finallyCallback || angular.noop);
      };

      /**
       * Executes login attempt using facebook connect,
       *
       * @param userDetails - Object of the following format:
       * {
       *    access_token: 'aaa',  // Facebook's access token
       *    facebook_id: 'bbb',   // The user's facebook id
       * }
       * @param successCallback
       * @param errorCallback
       * @param finallyCallback
       */
      this.facebookLogin = function(userDetails, successCallback, errorCallback, finallyCallback) {
        baseAuth.customPOST(userDetails, 'facebook_sign_in').then(function(response) {
          User.setUser(response.auth_token, response.profile);
          (successCallback || angular.noop)(response);
        }, errorCallback || angular.noop).finally(finallyCallback || angular.noop);
      };


      /**
       * Signs out and clear the session
       * @returns {*}
       */
      this.logout = function(successCallback, errorCallback, finallyCallback) {
        baseAuth.customPOST({}, 'sign_out').then(function(response) {
          User.clearUser();
          (successCallback || angular.noop)(response);
        }, errorCallback || angular.noop).finally(finallyCallback || angular.noop);
      }

      this.getFacebookScope = function() {
        return {scope: 'email,user_likes'};
      }

      // Handle authentication failure
      $rootScope.$on('Auth:Failed', Secure.authFailed);

      // Generate state transition handler, verify that the user is authenticated where needed
      $rootScope.$on('$stateChangeStart', Secure.transition);
    }]
  );

angular.module('ui-router-secure', ['ui.router']).provider('Secure', function() {
  var isAuthenticated = 'isAuthenticated';
  var defaultState = '';

  var isEmpty = function(obj) {
    return !(Object.getOwnPropertyNames(obj).length > 0);
  };

  var _buildSecure = function($state, toState) {
    var moreStates = true, currState = toState;
    var secure = {};
    while (moreStates) {
      secure = angular.extend(currState.secure || {}, secure);

      // Get the next state
      var currState = currState.name.split(".");
      if (currState.length > 1) {
        currState.pop();
        currState = $state.get(currState.join("."));
      } else {
        moreStates = false;
      }
    }
    return secure;
  };

  return {
    setIsAuthenticated: function(methodName) {
      isAuthenticated = methodName;
    },
    setDefaultState: function(state) {
      defaultState = state;
    },
    $get: [
      '$q', '$state', '$stateParams', 'User',
      function($q, $state, $stateParams, User) {
        var self = this;

        this.transition = function(event, toState, toParams, fromState, fromParams) {
          console.log("toState", toState);
          var secure = _buildSecure($state, toState);

          // Check if this state has secure instructions
          if (!!secure && !isEmpty(secure)) {
            console.log("secure", secure);
            if (angular.isDefined(secure.authenticated) && secure.authenticated && !User[isAuthenticated]()) {
              console.log("defaultState", defaultState);
              $state.go(defaultState);
              event.preventDefault();
            }
          }
        };
        this.authFailed = function() {
          console.log("Auth:Failed");
          User.clearUser();
          $state.go(defaultState);
        };

        return self;
      }
    ]
  };
}).run(['Secure', '$rootScope', function(Secure, $rootScope) {
  $rootScope.$on('Auth:Failed', Secure.authFailed);

  // Generate state transition handler, verify that the user is authenticated where needed
  $rootScope.$on('$stateChangeStart', Secure.transition);
}]);'use strict';

angular.module('ngSecure').
  service('User', ['$localStorage', '$timeout', function ($localStorage, $timeout) {
    var self = this;
    this.$storage = $localStorage;
    this.alerts = [];

    this.getAuthToken = function () {
      return this.$storage.authToken;
    };

    this.getUserDetails = function () {
      return this.$storage.userDetails;
    };

    this.setUser = function (authToken, userDetails) {
      self.$storage.authToken = authToken;
      self.$storage.userDetails = userDetails;
    };

    this.setUserDetails = function (userDetails) {
      self.$storage.userDetails = userDetails;
    };

    this.clearUser = function () {
      delete self.$storage.userDetails;
      delete self.$storage.authToken;
    };

    this.isAuthenticated = function () {
      return angular.isDefined(self.$storage.authToken) && self.$storage.authToken !== null;
    };

    // Getters
    this.getFirstName = function() {
      return this.$storage.userDetails ? this.$storage.userDetails.first_name : '';
    }
    this.getLastName = function() {
      return this.$storage.userDetails ? this.$storage.userDetails.last_name : '';
    }
    this.getFullName = function() {
      return self.getFirstName() + " " + self.getLastName();
    }
    this.getProfile = function() {
      return this.$storage.userDetails;
    }
  }]);})(window, document);