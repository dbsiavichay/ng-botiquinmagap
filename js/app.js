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
			.when('/compras', {
				templateUrl: 'views/compras.html',
				controller: 'ComprasController'			
			})
			.when('/compras/:id', {
				templateUrl: 'views/compra.html',
				controller: 'CompraController'
			})
			.when('/inventarios/', {
				templateUrl: 'views/inventario.html',
				controller: 'InventarioController'
			})
			.otherwise({
				redirectTo: '/'
			});
	}]);
})();