(function () {
	angular.module('botiquin.directives', [])
		.directive('asociacionList', function () {
			return {
				restrict: 'E',
				templateUrl: 'partials/asociacion-list.html'
			};
		});	
})();
