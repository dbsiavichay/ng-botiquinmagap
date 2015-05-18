(function() {
	angular.module('botiquin.services', [])

		.factory('ventaService',['$http', '$q', function ($http, $q) {
			var cliente = {};

			function getVentaPorId (id) {
				var deferred = $q.defer();

				$http.get('http://localhost:8000/ventas/'+id)
					.success(function (data) {
						deferred.resolve(data);
					});

				return deferred.promise;
			}
			
			return {
				getPorId: getVentaPorId,				
			}			
		}])
		.factory('asociacionService', ['$http', '$q', function ($http, $q) {

			function getAsociacionesTodos () {
				var deferred = $q.defer();

				$http.get('http://localhost:8000/asociaciones/')
					.success(function (data) {
						data.every(function (asociacion) {
							asociacion.tecnico = JSON.parse(asociacion.tecnico);
							asociacion.ubicacion = JSON.parse(asociacion.ubicacion);						
						});

						deferred.resolve(data);						
					});

				return deferred.promise;
			}

			function getAsociacionesPorTecnico (tecnico) {
				var deferred = $q.defer();

				$http.get('http://localhost:8000/asociaciones/?tecnico='+tecnico)
					.success(function (data) {
						data.every(function (asociacion) {
							asociacion.tecnico = JSON.parse(asociacion.tecnico);
							asociacion.ubicacion = JSON.parse(asociacion.ubicacion);						
						});

						deferred.resolve(data);						
					});

				return deferred.promise;
			}

			return {
				getTodos : getAsociacionesTodos,
				getPorTecnico : getAsociacionesPorTecnico 
			}
		}])
		.factory('enfermedadService', ['$http', '$q', function ($http, $q) {

			function getEnfermedadesTodos () { 
				var deferred = $q.defer();

				$http.get('http://localhost:8000/enfermedades/')
					.success(function (data) {
						deferred.resolve(data);
					});

				return deferred.promise;
			}

			return {
				getTodos : getEnfermedadesTodos,
			}
		}])
		.factory('especieService', ['$http', '$q', function ($http, $q) {

			function getEspeciesTodos () { 
				var deferred = $q.defer();

				$http.get('http://localhost:8000/especies/')
					.success(function (data) {
						deferred.resolve(data);
					});

				return deferred.promise;
			}

			return {
				getTodos : getEspeciesTodos,
			}
		}])
		.factory('clienteService', ['$http', '$q', function ($http, $q) {

			function getClientesTodos () {
				var deferred = $q.defer();

				$http.get('http://localhost:8000/clientes/')
					.success(function (data) {
						deferred.resolve(data);
					});

				return deferred.promise;
			}

			return {
				getTodos: getClientesTodos,
			}
		}])
		.factory('productoService', ['$http', '$q', function ($http, $q) {

			function getProductosTodos () {
				var deferred = $q.defer();

				$http.get('http://localhost:8000/productos/')
					.success(function (data) {
						deferred.resolve(data);
					});

				return deferred.promise;
			}

			return {
				getTodos: getProductosTodos,
			}
		}]);
})();