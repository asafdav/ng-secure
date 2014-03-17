'use strict';

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
  }]);