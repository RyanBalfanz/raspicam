(function() {
	"use strict";

	angular
		.module("app", ["firebase"])
		.constant("FIREBASE_APP_URL", "https://raspberrypi3.firebaseio.com/")
		.factory("Auth", Auth)
		.factory("snapshotService", snapshotService)
		.directive("snapList", snapList)
		.directive("snapListItem", snapListItem)
		.run(function($window, Auth) {
			if (!Auth.$getAuth()) {
				console.warn("You are not logged in.");
				var email = $window.prompt("Email");
				var password = $window.prompt("Password");
				var authData = Auth.$authWithPassword({
					email: email,
					password: password
				});
			} else {
				console.log("You are logged in as: " + Auth.$getAuth());
			}
		});

	Auth.$inject = ["$firebaseAuth", "FIREBASE_APP_URL"];
	function Auth($firebaseAuth, FIREBASE_APP_URL) {
		return $firebaseAuth(new Firebase(FIREBASE_APP_URL));
	}

	snapshotService.$inject = ["$firebaseArray", "$firebaseObject", "Auth", "FIREBASE_APP_URL"];
	function snapshotService($firebaseArray, $firebaseObject, Auth, FIREBASE_APP_URL) {
		return {
			get: get,
			getLatest: getLatest
		};

		function get(id) {
			var ref = getReference().child(id);
			return $firebaseObject(ref, Auth.$getAuth());
		}

		function getLatest(n) {
			var ref = getReference();
			var query = ref.orderByChild("timestamp").limitToLast(n || 1);

			return $firebaseArray(query, Auth.$getAuth());
		}

		function getReference() {
			var ref = new Firebase(FIREBASE_APP_URL).child("snaps");
			return ref;
		}
	}

	snapListItem.$inject = ["snapshotService"];
	function snapListItem(snapshotService) {
		var directive = {
			link: link,
			templateUrl: 'snap-list-item.html',
			restrict: 'EA'
		};
		return directive;

		function link(scope, element, attrs) {
			var key = attrs.id;
			scope.data = snapshotService.get(key);
		}
	}

	snapList.$inject = ["snapshotService"];
	function snapList(snapshotService) {
		var directive = {
			link: link,
			templateUrl: 'snap-list.html',
			restrict: 'EA'
		};
		return directive;

		function link(scope, element, attrs) {
			var n = parseInt(attrs.n || "1");
			scope.snaps = snapshotService.getLatest(n);
		}
	}
}());
