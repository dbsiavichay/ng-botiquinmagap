(function() {
	var asociacionUrl = 'http://192.168.1.30:8000/asociaciones/';
	var productoUrl = 'http://192.168.1.30:8000/productos/';
	var enfermedadUrl = 'http://192.168.1.30:8000/enfermedades/';
	var especieUrl = 'http://192.168.1.30:8000/especies/';
	var ventaUrl= 'http://192.168.1.30:8000/ventas/';
	var detalleVentaUrl = 'http://192.168.1.30:8000/detallesventa/';
	var usosVentaUrl = 'http://192.168.1.30:8000/usosventa/';	
	var clienteUrl = 'http://192.168.1.30:8000/clientes/';

	angular.module('botiquin.services', [])

		.factory('ventaService',['$http', '$q', 'asociacionService', function ($http, $q, asociacionService) {			
			function getVentaPorId (id) {
				var deferred = $q.defer();

				$http.get(ventaUrl+id)
					.success(function (venta) {
						$http.get(clienteUrl+venta.cliente)
							.success(function (cliente) {
								venta.cliente = cliente;							
							});

						$http.get(asociacionUrl+venta.asociacion)
							.success(function (asociacion) {
								venta.asociacion = asociacion;
							});

						$http.get(detalleVentaUrl+'?venta='+venta.id)
							.success(function (detalles) {
								detalles.forEach(function (detalle) {
									$http.get(productoUrl+detalle.producto)
										.success(function (producto) {
											detalle.producto = producto;
										});

									$http.get(usosVentaUrl+'?detalleventa='+detalle.id)
										.success(function (usos) {
											detalle.usos = usos;
											deferred.resolve({
												venta: venta,
												detalles: detalles
											});
										});
								});
							});						

					});

				return deferred.promise;
			}

			function getVentaTodos () {
				var deferred = $q.defer();

				$http.get(ventaUrl)
					.success(function (ventas) {						
						deferred.resolve(ventas);
					});

				return deferred.promise;	
			}

			var formatFecha = function (fecha) {
				var yyyy = fecha.getFullYear().toString();
				var mm = (fecha.getMonth()+1).toString();
				var dd  = fecha.getDate().toString();				
				return yyyy +'-'+(mm[1]?mm:"0"+mm[0]) +'-'+ (dd[1]?dd:"0"+dd[0]);
			}

			function guardar (data) {
				$http.post(ventaUrl, {
					fecha: formatFecha(data.venta.fecha),
					valor_total: data.venta.valor_total,
					cliente: data.venta.cliente.id,
					asociacion: data.venta.asociacion.id
				}).success(function (venta) {					
					data.detalles.forEach(function (_detalle) {
						$http.post(detalleVentaUrl, {
							cantidad: _detalle.cantidad,
							precio_unitario: _detalle.valorUnitario,
							precio_total: _detalle.valorTotal,
							producto:_detalle.producto.id,
							venta: venta.id
						}).success(function (detalle) {
							_detalle.usos.forEach(function (_uso) {
								$http.post(usosVentaUrl, {
									cantidad: _uso.cantidad,
									enfermedad: _uso.enfermedad.id,
									especie: _uso.especie.id,
									detalle_venta: detalle.id
								});
							});
						});
					});					
				}).error(function (err) {
					console.log(err);
				});
			}
			
			return {
				getPorId: getVentaPorId,
				getTodos: getVentaTodos,
				guardar: guardar
			}			
		}])
		.factory('asociacionService', ['$http', '$q',function ($http, $q) {			
			function getAsociacionPorId (id) {
				var deferred = $q.defer();

				$http.get(asociacionUrl+id)
					.success(function (data) {						
						data.tecnico = JSON.parse(data.tecnico);
						data.ubicacion = JSON.parse(data.ubicacion);												
						deferred.resolve(data);						
					});

				return deferred.promise;
			}

			function getAsociacionesTodos () {
				var deferred = $q.defer();

				$http.get(asociacionUrl)
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
				getPorId : getAsociacionPorId,
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

			function getClientesPorId (id) {
				var deferred = $q.defer();

				$http.get('http://192.168.1.30:8000/clientes/'+id)
					.success(function (data) {
						deferred.resolve(data);
					});

				return deferred.promise;
			}
			
			function getClientesTodos () {
				var deferred = $q.defer();

				$http.get('http://localhost:8000/clientes/')
					.success(function (data) {
						deferred.resolve(data);
					});

				return deferred.promise;
			}

			return {
				getPorId: getClientesPorId,
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