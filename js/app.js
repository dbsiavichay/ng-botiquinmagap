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
				templateUrl: 'views/login.html',
				controller: 'LoginController'
			})
			.when('/asociaciones', {
				templateUrl: 'views/lista-asociaciones.html',
				controller: 'AsociacionController'
			})
			.when('/ventas', {
				templateUrl: 'views/ventas.html',
				controller: 'VentasController'			
			})
			.when('/ventas/:id', {
				templateUrl: 'views/venta.html',
				controller: 'VentasController'
			})
			.when('/clientes', {
				templateUrl: 'views/clientes.html',
				controller: 'ClienteController'
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
				templateUrl: 'views/inventarios.html',
				controller: 'InventariosController'
			})
			.when('/inventarios/:id', {
				templateUrl: 'views/inventario.html',
				controller: 'InventarioController'
			})
			.when('/reportecomercial', {
				templateUrl: 'views/reporte-comercial.html'				
			})
			.when('/reportekardex', {
				templateUrl: 'views/reporte-kardex.html'				
			})
			.when('/reportegeneral', {
				templateUrl: 'views/reporte-general.html'				
			})
			.otherwise({
				redirectTo: '/'
			});
	}]);
})();