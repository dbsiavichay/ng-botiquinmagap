(function() {
	var baseUrl = 'http://127.0.0.1:8000/'
	var asociacionUrl = 'http://127.0.0.1:8000/asociaciones/';
	var productoUrl = 'http://127.0.0.1:8000/productos/';
	var enfermedadUrl = 'http://127.0.0.1:8000/enfermedades/';
	var especieUrl = 'http://127.0.0.1:8000/especies/';	
	var detalleVentaUrl = 'http://127.0.0.1:8000/detallesventa/';
	var usosVentaUrl = 'http://127.0.0.1:8000/usosventa/';
	var clienteUrl = 'http://127.0.0.1:8000/clientes/';

	angular.module('botiquin.services', [])

		.factory('ventaService',['$http', '$q', 'asociacionService', function ($http, $q, asociacionService) {
			function getVentaPorId (id) {
				var deferred = $q.defer();				

				$http.get(baseUrl+'ventas/'+id)
					.success(function (venta) {
						$http.get(clienteUrl+venta.cliente)
							.success(function (cliente) {
								venta.cliente = cliente;							
							});

						$http.get(detalleVentaUrl+'?venta='+venta.id)
							.success(function (detalles) {
								var petsProducto = detalles.map(function (detalle) {
									return $http.get(baseUrl+'productos/'+detalle.producto);
								});

								$q.all(petsProducto).then(function (productos) {									
									for(var i in detalles) {
										for(var j in productos) {
											if(detalles[i].producto === productos[j].data.id){
												detalles[i].producto = productos[j].data;
												break;
											}
										}
									}

									var petsUsos = detalles.map(function (detalle) {
										return $http.get(baseUrl+'usosventa/?detalleventa='+detalle.id);
									});

									$q.all(petsUsos).then(function (usos) {
										for(var i in detalles) {
											detalles[i].usos = [];											
											for(var j=0;j<usos.length;j++) {
												var usos_detalle = usos[j].data;
												window.usos = usos[0].data;
												for(var k=0;k<usos_detalle.length;k++){													
													if(detalles[i].id === usos_detalle[k].detalle_venta) {
														detalles[i].usos.push(usos_detalle[k]);
													}
												}
											}
										}
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

				$http.get(baseUrl+'ventas/')
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
				var deferred = $q.defer();
				$http.post(baseUrl+'ventas/', {
					fecha: formatFecha(data.venta.fecha),
					valor_total: data.venta.valor_total,
					cliente: data.venta.cliente.id,
					asociacion: data.venta.asociacion
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
								}).success(function () {
									deferred.resolve();
								});
							});
						});
					});					
				});
				return deferred.promise;
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

				$http.get(asociacionUrl+'?tecnico='+tecnico)
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

				$http.get(enfermedadUrl)
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

				$http.get(especieUrl)
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

				$http.get(clienteUrl+id)
					.success(function (data) {
						deferred.resolve(data);
					});

				return deferred.promise;
			}
			
			function getClientesTodos () {
				var deferred = $q.defer();

				$http.get(clienteUrl)
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

				$http.get(productoUrl)
					.success(function (data) {
						deferred.resolve(data);
					});

				return deferred.promise;
			}

			return {
				getTodos: getProductosTodos,
			}
		}])
		.factory('compraService', ['$http', '$q', function ($http, $q) {
			function getCompraPorId (id) {
				var deferred = $q.defer();				

				$http.get(baseUrl+'compras/'+id)
					.success(function (compra) {						
						$http.get(baseUrl+'detallescompra?compra='+compra.id)
							.success(function (detalles) {
								var peticiones = detalles.map(function (detalle) {
									return $http.get(baseUrl+'productos/'+detalle.producto);
								});

								$q.all(peticiones).then(function (productos) {									
									for(var i in detalles) {
										for(var j in productos) {
											if(detalles[i].producto === productos[j].data.id){
												detalles[i].producto = productos[j].data;
												break;
											}
										}
									}
									deferred.resolve({
										compra: compra,
										detalles: detalles
									});
								});
							});
					});

				return deferred.promise;
			}

			function getCompraTodos () {
				var deferred = $q.defer();
				var peticiones = [];
				$http.get(baseUrl+'compras/')
					.success(function (compras) {
						peticiones = compras.map(function (compra) {
							return $http.get(baseUrl+'asociaciones/'+compra.asociacion);
						});

						$q.all(peticiones).then(function (asociaciones) {
							for(var i=0;i<compras.length;i++) {
								for(var j=0;j<asociaciones.length;j++) {
									if(compras[i].asociacion === asociaciones[j].data.id) {
										compras[i].asociacion = asociaciones[j].data;
										break;
									}
								}
							}
							deferred.resolve(compras);
						});
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
				var deferred = $q.defer();
				$http.post(baseUrl+'compras/', {
					fecha: formatFecha(data.compra.fecha),
					valor_total: data.compra.valor_total,					
					asociacion: data.compra.asociacion
				}).success(function (compra) {					
					data.detalles.forEach(function (_detalle) {
						$http.post(baseUrl+'detallescompra/', {
							cantidad: _detalle.cantidad,
							costo_unitario: _detalle.valorUnitario,
							costo_total: _detalle.valorTotal,
							producto:_detalle.producto.id,
							compra: compra.id
						}).success(function (detalle) {
							deferred.resolve();							
						});
					});					
				});
				return deferred.promise;
			}
			
			return {	
				getPorId: getCompraPorId,			
				getTodos: getCompraTodos,
				guardar: guardar
			}
		}])
		.factory('inventarioService', ['$http', '$q', 'asociacionService', function ($http, $q, asociacionService) {
			function getInventarioPorAsociacionProducto(asociacion, producto) {
				var deferred = $q.defer();
				
				$http.get(baseUrl+'inventarios/?asociacion='+asociacion+'&producto='+producto)
					.success(function (inventarios) {
						var inventario = {};
						if(inventarios.length>0){
							inventario = inventarios[0];
						}
						
						deferred.resolve(inventario);						
					});

				return deferred.promise;	
			}

			function getInventarioTodos() {
				var deferred = $q.defer();
				
				$http.get(baseUrl+'inventarios/')
					.success(function (inventarios) {
						var peticiones = inventarios.map(function (inventario) {
							return $http.get(baseUrl+'productos/'+inventario.producto);
						});

						$q.all(peticiones).then(function (productos) {
							for(var i = 0; i < inventarios.length; i++) {
								for(var j = 0; j < productos.length; j++) {
									if(inventarios[i].producto == productos[j].data.id) {
										inventarios[i].producto = productos[j].data;
										break;
									}
								}
							}							
							deferred.resolve(inventarios);						
						})
					});

				return deferred.promise;	
			}


			function guardarInventario (kardex) {
				var deferred = $q.defer();
				
				$http.post(baseUrl+'inventarios/', {
					cantidad: kardex.cantidad,
					valor_unitario: kardex.valor_unitario,					
					producto: kardex.producto.id,
					asociacion: kardex.asociacion
				}).success(function (inventario) {
					$http.post(baseUrl+'kardexs/', {
						fecha: formatFecha(kardex.fecha),
						tipo_transaccion: kardex.tipo_transaccion,
						descripcion: kardex.transaccion + ' - ' + kardex.descripcion,
						cantidad: kardex.cantidad,
						valor_unitario: kardex.valor_unitario,
						saldo: kardex.cantidad,
						producto: kardex.producto.id,
						asociacion: kardex.asociacion
					}).success(function () {
						deferred.resolve();
					})
				});

				return deferred.promise;		
			}

			function editarInventario (inventario, kardex) {
				var deferred = $q.defer();				
				var _cantidad = kardex.tipo_transaccion == 1?
					inventario.cantidad + kardex.cantidad:inventario.cantidad - kardex.cantidad;


				$http.put(baseUrl+'inventarios/'+inventario.id+'/', {
					cantidad: _cantidad,
					valor_unitario: kardex.valor_unitario,					
					producto: kardex.producto.id,
					asociacion: kardex.asociacion
				}).success(function (inventario) {
					$http.post(baseUrl+'kardexs/', {
						fecha: formatFecha(kardex.fecha),
						tipo_transaccion: kardex.tipo_transaccion,
						descripcion: kardex.transaccion + ' - ' + kardex.descripcion,
						cantidad: kardex.cantidad,
						valor_unitario: kardex.valor_unitario,
						saldo: _cantidad,
						producto: kardex.producto.id,
						asociacion: kardex.asociacion
					}).success(function () {
						deferred.resolve();
					});
				});

				return deferred.promise;	
			}

			function getAsociaciones () {
				var deferred = $q.defer();

				asociacionService.getTodos()
					.then(function (data) {
						deferred.resolve(data)
					});

				return deferred.promise;	
			}

			var formatFecha = function (fecha) {
				var yyyy = fecha.getFullYear().toString();
				var mm = (fecha.getMonth()+1).toString();
				var dd  = fecha.getDate().toString();				
				return yyyy +'-'+(mm[1]?mm:"0"+mm[0]) +'-'+ (dd[1]?dd:"0"+dd[0]);
			}

			return {
				getAsociaciones: getAsociaciones,
				getPorAsociacionProducto: getInventarioPorAsociacionProducto,
				getTodos: getInventarioTodos,
				guardar: guardarInventario,
				editar: editarInventario
			}
		}])
		.factory('reporteService', ['$http', '$q', 'asociacionService', function ($http, $q, asociacionService) {
			function getAsociaciones () {
				var deferred = $q.defer();

				asociacionService.getTodos()
					.then(function (data) {
						deferred.resolve(data)
					});

				return deferred.promise;	
			}

			function getVentasMensuales(mes, asociacion) {
				var deferred = $q.defer();				
				var detalles = [];
				var peticiones = [];

				$http.get(baseUrl+'detallesventa/?asociacion='+asociacion+'&mes='+mes)
					.success(function (data) {												
						if(data.length > 0) {
							peticiones.push($http.get(baseUrl+'productos/'+data[0].producto));
							detalles.push({
								cantidad : parseFloat(data[0].cantidad),
								producto : data[0].producto,
								precio_unitario : parseFloat(data[0].precio_unitario),
								precio_total : parseFloat(data[0].precio_total)
							});
						}

						for (var i = 1; i < data.length; i++) {
							var encontrado = false;
							for (var j = 0; j < detalles.length; j++) {
								if(data[i].producto === detalles[j].producto) {
									detalles[j].cantidad = parseFloat(data[i].cantidad) + detalles[j].cantidad;
									detalles[j].precio_total = parseFloat(data[i].precio_total) + detalles[j].precio_total;
									encontrado = true;
									break;																		
								}
							}
							if(!encontrado) {
								peticiones.push($http.get(baseUrl+'productos/'+data[i].producto));
								detalles.push({
								cantidad : parseFloat(data[i].cantidad),
								producto : data[i].producto,
								precio_unitario : parseFloat(data[i].precio_unitario),
								precio_total : parseFloat(data[i].precio_total)
							});
							}
						}

						$q.all(peticiones)
							.then(function (productos) {								
								for (var i = 0; i < productos.length; i++) {
									for (var j = 0; j < detalles.length; j++) {
										if(productos[i].data.id===detalles[j].producto) {
											detalles[j].producto = productos[i].data;
											break;
										}
									}
								}
								deferred.resolve(detalles);
							});
					});

				return deferred.promise;
			}

			return {
				getAsociaciones: getAsociaciones,
				getVentasMensuales: getVentasMensuales
			}
		}]);
})();