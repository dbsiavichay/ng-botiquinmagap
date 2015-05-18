(function(){		
	var app = angular.module('botiquin', [
		'ngRoute',
		'botiquin.controllers',
		'botiquin.directives',
		'botiquin.services',
		'ui.bootstrap',		
		]);

	app.config(['$routeProvider', function ($routeProvider) {
		$routeProvider
			.when('/', {
				templateUrl: 'views/lista-asociaciones.html',
				controller: 'AsociacionController'
			})
			.when('/ventas', {
				templateUrl: 'views/lista-ventas.html',
				controller: 'VentasController'			
			})
			.when('/ventas/:id', {
				templateUrl: 'views/venta.html',
				controller: 'VentasController'
			})
			.otherwise({
				redirectTo: '/'
			});
	}]);
})();