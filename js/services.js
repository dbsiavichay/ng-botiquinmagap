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

		.factory('ventaService',['$http', '$q', 'asociacionService', 'clienteService', function ($http, $q, asociacionService, clienteService) {
			function getVentaPorId (id) {
				var deferred = $q.defer();

				var promesaVenta = $q(function (resolve, reject) {
					$http.get(baseUrl+'ventas/'+id)
						.success(function (data) {
							resolve(data);
						})
						.error(function (error) {
							reject(error);
						});
				});

				var promesaClienteAsociacion = promesaVenta
					.then(function (data) {
						var peticionCliente = $http.get(baseUrl+'clientes/'+data.cliente);
						var peticionAsociacion = $http.get(baseUrl+'asociaciones/'+data.asociacion);

						return $q.all([peticionCliente, peticionAsociacion])
							.then(function (alldata) {
								for(var i = 0; i < alldata.length; i++) {
									if(alldata[i].config.url.indexOf('clientes') > -1) {
										data.cliente = alldata[i].data;
									}else{
										data.asociacion = alldata[i].data;
									}									
								}
								return data;	
							});						
						});

				var promesaProductos = promesaClienteAsociacion
					.then(function (data) {
						var detalles = data.detalles;
						var peticiones = detalles.map(function (detalle) {
							return $http.get(baseUrl+'productos/'+detalle.producto);
						});

						return $q.all(peticiones)
							.then(function (alldata) {								
								for(var i = 0; i < detalles.length; i++) {
									for(var j = 0; j < alldata.length; j++) {
										if(detalles[i].producto === alldata[j].data.id) {
											detalles[i].producto = alldata[j].data;
											break;
										}
									}	
								}
								return data;
							});
					});
			

				var promesaUsos = promesaProductos
					.then(function (data) {
						var solicitudes = [];

						data.detalles.forEach(function (detalle) {
							detalle.usos.forEach(function (uso) {
								if(solicitudes.length === 0) {
									solicitudes.push('enfermedades/'+uso.enfermedad);
									solicitudes.push('especies/'+uso.especie);								
								}

								if(solicitudes.indexOf('enfermedades/'+uso.enfermedad) < 0){
									solicitudes.push('enfermedades/'+uso.enfermedad);
								}

								if(solicitudes.indexOf('especies/'+uso.especie) < 0){
									solicitudes.push('especies/'+uso.especie);
								}
							});
						});

						var peticiones = solicitudes.map(function (item) {
							return $http.get(baseUrl+item);
						});						

						return $q.all(peticiones)
							.then(function (alldata) {
								data.detalles.forEach(function (detalle) {
									detalle.usos.forEach(function (uso) {
										for(var i = 0; i < alldata.length; i++){
											if(alldata[i].config.url.indexOf('enfermedades') > -1) {
												if(uso.enfermedad === alldata[i].data.id) {
													uso.enfermedad = alldata[i].data;
													break;
												}
											}										
										}

										for(var i = 0; i < alldata.length; i++){										
											if(alldata[i].config.url.indexOf('especies') > -1){
												if(uso.especie === alldata[i].data.id) {
													uso.especie = alldata[i].data;
													break;
												}
											}
										}										
									});
								});								
								return data;
							});
					});

				promesaUsos
					.then(function (data) {
						deferred.resolve(data);
					});				

				return deferred.promise;
			}

			function getVentaTodos (asociacion) {
				var deferred = $q.defer();

				var promesa = $q(function (resolve, reject) {
					$http.get(baseUrl+'ventas/?asociacion='+asociacion)
						.success(function (data) {						
							resolve(data);
						})
						.error(function (error) {
							reject(error);
						});	
				});

				var promesaClienteAsociacion = promesa
					.then(function (data) {						
						var solicitudes = [];

						data.forEach(function (item) {
							if(solicitudes.length === 0) {
								solicitudes.push('clientes/'+item.cliente);
								solicitudes.push('asociaciones/'+item.asociacion);								
							}

							if(solicitudes.indexOf('clientes/'+item.cliente) < 0){
								solicitudes.push('clientes/'+item.cliente);
							}

							if(solicitudes.indexOf('asociaciones/'+item.asociacion) < 0){
								solicitudes.push('asociaciones/'+item.asociacion);
							}							
						});

						var peticiones = solicitudes.map(function (item) {
							return $http.get(baseUrl+item);
						});						

						return $q.all(peticiones)
							.then(function (alldata) {
								data.forEach(function (item) {
									for(var i = 0; i < alldata.length; i++){
										if(alldata[i].config.url.indexOf('clientes') > -1) {
											if(item.cliente === alldata[i].data.id) {
												item.cliente = alldata[i].data;
												break;
											}
										}										
									}

									for(var i = 0; i < alldata.length; i++){										
										if(alldata[i].config.url.indexOf('asociaciones') > -1){
											if(item.asociacion === alldata[i].data.id) {
												item.asociacion = alldata[i].data;
												break;
											}
										}
									}
								});								
								return data;
							});						
					});

				promesaClienteAsociacion
					.then(function (data) {
						deferred.resolve(data);
					});

				
				return deferred.promise;	
			}

			var formatFecha = function (fecha) {
				var yyyy = fecha.getFullYear().toString();
				var mm = (fecha.getMonth()+1).toString();
				var dd  = fecha.getDate().toString();				
				return yyyy +'-'+(mm[1]?mm:"0"+mm[0]) +'-'+ (dd[1]?dd:"0"+dd[0]);
			}

			function crear (venta) {					
				var deferred = $q.defer();

				var promesaVenta = $q(function (resolve, reject) {
					$http.post(baseUrl+'ventas/', {
						fecha: formatFecha(venta.fecha),
						valor_total: venta.valor_total,
						cliente: venta.cliente.id,
						asociacion: venta.asociacion.id
					})
					.success(function (data) {
						resolve(data);
					})
					.error(function (error) {						
						reject(error);
					});
				});

				var promesaDetalles = promesaVenta
					.then(function (data) {
						venta.detalles.forEach(function (detalle) {
							detalle.venta = data.id;
							detalle.producto = detalle.inventario.producto.id;
							$http.post(baseUrl+'detallesventa/', detalle)
								.success(function (_detalle) {
									detalle.usos.forEach(function (uso) {
										uso.enfermedad = uso.enfermedad.id;
										uso.especie = uso.especie.id;
										uso.detalle_venta = _detalle.id;
										$http.post(baseUrl+'usosventa/', uso);
									});

									$http.get(baseUrl+'inventarios/?producto='+detalle.producto+'&asociacion='+venta.asociacion.id)
										.success(function (data) {
											if(data.length) {
												var inventario = data[0];
												inventario.cantidad = parseFloat(inventario.cantidad) - parseFloat(detalle.cantidad);
												//inventario.valor_unitario = parseFloat(detalle.precio_unitario);
												$http.put(baseUrl+'inventarios/'+inventario.id+'/', inventario);
											}else{
												inventario = {
													cantidad: -detalle.cantidad,
													valor_unitario: detalle.precio_unitario,
													producto: detalle.producto,
													asociacion: venta.asociacion.id
												}
												$http.post(baseUrl+'inventarios/', inventario);
											}
										});

									detalle.caducidad.forEach(function (caducidad) {
										for(var i = 0; i < detalle.inventario.caducidades.length; i++) {
											var fechas = detalle.inventario.caducidades;					
											var fecha = new Date(fechas[i].fecha);
											fecha.setDate(fechas[i].fecha.split('-')[2]);

											var igual = true;
											if(caducidad.fecha.getDate() != fecha.getDate())  igual = false;
											if(caducidad.fecha.getMonth() != fecha.getMonth()) igual = false;
											if(caducidad.fecha.getFullYear() != fecha.getFullYear()) igual = false;

											if(igual){
												var caducidadbase = fechas[i];
												caducidadbase.cantidad = parseFloat(caducidadbase.cantidad) - parseFloat(caducidad.cantidad);
												if(caducidadbase.cantidad > 0) 
													$http.put(baseUrl+'caducidad/'+caducidadbase.id+'/', caducidadbase);
												else
													$http.delete(baseUrl+'caducidad/'+caducidadbase.id+'/');											
											}
										}																			
									});									
								});
						});

						deferred.resolve();						
					});				

				return deferred.promise;
			}			

			function getClientePorCedula(cedula) {
				return clienteService.getPorCedula(cedula);
			}

			function getAsociaciones () {
				return asociacionService.getTodos();
			}
			
			return {
				getPorId: getVentaPorId,
				getTodos: getVentaTodos,
				getClientePorCedula: getClientePorCedula,
				getAsociaciones: getAsociaciones,
				crear: crear,				
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

			function getClientePorCedula(cedula) {
				var deferred = $q.defer();
					$http.get(baseUrl+'clientes/?filtro='+cedula)
						.success(function (data) {
							if(data.length > 0) deferred.resolve(data[0]);
							else deferred.resolve(null);
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

			function crearCliente(cliente) {
				var deferred = $q.defer();

				$http.post(baseUrl+'clientes/', cliente)
					.success(function (data) {
						deferred.resolve(data);
					})
					.error(function (error) {
						deferred.reject(error);
					});

				return deferred.promise;
			}

			function editarCliente(cliente) {
				var deferred = $q.defer();

				$http.put(baseUrl+'clientes/'+cliente.id+'/', cliente)
					.success(function (data) {
						deferred.resolve(data);
					})
					.error(function (error) {
						deferred.reject(error);
					});

				return deferred.promise;
			}

			return {
				getPorId: getClientesPorId,
				getPorCedula: getClientePorCedula,
				getTodos: getClientesTodos,
				crear: crearCliente,
				editar: editarCliente
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
		.factory('compraService', ['$http', '$q', 'asociacionService',function ($http, $q, asociacionService) {
			function getCompraPorId (id) {
				var deferred = $q.defer();

				var promesaCompra = $q(function (resolve, reject) {
					$http.get(baseUrl+'compras/'+id)
						.success(function (data) {
							resolve(data);
						})
						.error(function (error) {
							reject(error);
						});
				});

				var promesaAsociacion = promesaCompra
					.then(function (data) {						
						return $q(function (resolve, reject) {
							$http.get(baseUrl+'asociaciones/'+data.asociacion)
								.success(function (asociacion) {
									data.asociacion = asociacion;
									resolve(data);
								})
								.error(function (error) {
									reject(error);
								});							
						});
					});
						
				var promesaProductos = promesaAsociacion
					.then(function (data) {						
						var detalles = data.detalles;
						var peticiones = detalles.map(function (detalle) {
							return $http.get(baseUrl+'productos/'+detalle.producto);
						});

						return $q.all(peticiones)
							.then(function (alldata) {								
								for(var i = 0; i < detalles.length; i++) {
									for(var j = 0; j < alldata.length; j++) {
										if(detalles[i].producto === alldata[j].data.id) {
											detalles[i].producto = alldata[j].data;
											break;
										}
									}	
								}
								return data;
							});
					});
							
				promesaProductos
					.then(function (data) {
						deferred.resolve(data);
					});				

				return deferred.promise;
			}

			function getCompraTodos (asociacion) {
				var deferred = $q.defer();

				var promesa = $q(function (resolve, reject) {
					$http.get(baseUrl+'compras/?asociacion='+asociacion)
						.success(function (data) {						
							resolve(data);
						})
						.error(function (error) {
							reject(error);
						});	
				});

				var promesaAsociacion = promesa
					.then(function (data) {						
						var solicitudes = [];

						data.forEach(function (item) {
							if(solicitudes.length === 0) {								
								solicitudes.push('asociaciones/'+item.asociacion);								
							}

							if(solicitudes.indexOf('asociaciones/'+item.asociacion) < 0){
								solicitudes.push('asociaciones/'+item.asociacion);
							}							
						});						

						var peticiones = solicitudes.map(function (item) {
							return $http.get(baseUrl+item);
						});						

						return $q.all(peticiones)
							.then(function (alldata) {
								data.forEach(function (item) {								
									for(var i = 0; i < alldata.length; i++){																				
										if(item.asociacion === alldata[i].data.id) {
											item.asociacion = alldata[i].data;
											break;
										}										
									}
								});								
								return data;
							});						
					});

				promesaAsociacion
					.then(function (data) {
						deferred.resolve(data);
					});

				
				return deferred.promise;	
			}		

			var formatFecha = function (fecha) {
				var yyyy = fecha.getFullYear().toString();
				var mm = (fecha.getMonth()+1).toString();
				var dd  = fecha.getDate().toString();				
				return yyyy +'-'+(mm[1]?mm:"0"+mm[0]) +'-'+ (dd[1]?dd:"0"+dd[0]);
			}

			function crear (compra) {					
				var deferred = $q.defer();

				var promesaCompra = $q(function (resolve, reject) {
					$http.post(baseUrl+'compras/', {
						fecha: formatFecha(compra.fecha),
						valor_total: compra.valor_total,						
						asociacion: compra.asociacion.id
					})
					.success(function (data) {
						resolve(data);
					})
					.error(function (error) {						
						reject(error);
					});
				});

				var promesaDetalles = promesaCompra
					.then(function (data) {
						compra.detalles.forEach(function (detalle) {
							detalle.compra = data.id;
							detalle.producto = detalle.producto.id;
							$http.post(baseUrl+'detallescompra/', detalle)
								.success(function (_detalle) {	
									$http.get(baseUrl+'inventarios/?producto='+detalle.producto+'&asociacion='+compra.asociacion.id)
										.success(function (data) {
											if(data.length) {
												var inventario = data[0];
												inventario.cantidad = parseFloat(inventario.cantidad) + parseFloat(detalle.cantidad);
												inventario.valor_unitario = parseFloat(detalle.costo_unitario);
												$http.put(baseUrl+'inventarios/'+inventario.id+'/', inventario);
											}else{
												inventario = {
													cantidad: detalle.cantidad,
													valor_unitario: detalle.costo_unitario,
													producto: detalle.producto,
													asociacion: compra.asociacion.id											
												}
												$http.post(baseUrl+'inventarios/', inventario);
											}
										});

								
									$http.get(baseUrl+'caducidad/?producto='+detalle.producto+'&asociacion='+compra.asociacion.id)
										.success(function (data) {
											for(var i = 0; i < detalle.caducidad.length; i++) {
												var caducidadcliente = detalle.caducidad[i];
												for(var j = 0; j < data.length; j++) {
													var caducidadbase = data[j];
													if(formatFecha(caducidadcliente.fecha) === caducidadbase.fecha) {
														caducidadcliente.id = caducidadbase.id;														
														caducidadcliente.cantidad = parseFloat(caducidadcliente.cantidad) + parseFloat(caducidadbase.cantidad);
														break;														
													}
												}
											}

											detalle.caducidad.forEach(function (caducidad) {
												caducidad.fecha = formatFecha(caducidad.fecha);
												caducidad.producto = detalle.producto;
												caducidad.asociacion = compra.asociacion.id;
												if(caducidad.id) {
													$http.put(baseUrl+'caducidad/'+caducidad.id+'/', caducidad);
												}else{
													$http.post(baseUrl+'caducidad/', caducidad);
												}
											});
										});
								});
						});

						deferred.resolve();						
					});				

				return deferred.promise;
			}

			function getAsociaciones () {
				return asociacionService.getTodos();
			}
			
			return {	
				getPorId: getCompraPorId,			
				getTodos: getCompraTodos,
				crear: crear,
				getAsociaciones: getAsociaciones
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

			function getInventarioTodos(asociacion) {
				var deferred = $q.defer();

				var promesaInventario = $q(function (resolve, reject) {
					$http.get(baseUrl+'inventarios/?asociacion'+asociacion)
						.success(function (data) {
							resolve(data);
						})
						.error(function (error) {
							reject(error);
						});
				});

				var promesaProductos = promesaInventario
					.then(function (data) {
						var peticiones = data.map(function (inventario) {
							return $http.get(baseUrl+'productos/'+inventario.producto);
						});

						return $q.all(peticiones)
							.then(function (alldata) {
								for(var i = 0; i < data.length; i++) {
									for(var j = 0; j < alldata.length; j++) {
										if(data[i].producto == alldata[j].data.id) {
											data[i].producto = alldata[j].data;
											break;
										}
									}
								}							
								return data;
							});
					});
				
				var promesaCaducidad = promesaProductos
					.then(function (data) {
						var peticiones = data.map(function (inventario) {
							return $http.get(baseUrl+'caducidad/?producto='+inventario.producto.id+'&asociacion='+asociacion);
						});

						return $q.all(peticiones)
							.then(function (alldata) {								
								data.forEach(function (inventario) {
									for(var i = 0; i < alldata.length; i++){
										if(alldata[i].config.url.indexOf('producto='+inventario.producto.id) > -1) {
											var caducidades = alldata[i].data;
											var days = 1000000000000000;
											for(var j=0; j < caducidades.length; j++) {
												if(caducidades[j].dias < days) days = caducidades[j].dias;
											}

											inventario.dias = days;
											inventario.caducidades = caducidades;											
											break;
										}
									}
								});
								return data;
							});
					});

					promesaCaducidad
						.then(function (data) {
							deferred.resolve(data);
						});

				return deferred.promise;	
			}


			function crearInventario (inventario) {
				var deferred = $q.defer();
				inventario.asociacion = inventario.asociacion.id;
				inventario.producto = inventario.producto.id;

				var promesaInventario = $q(function (resolve, reject) {
					$http.post(baseUrl+'inventarios/', inventario)
						.success(function (data) {
							resolve(data);
						})
						.error(function (error) {
							reject(error);
						});
				});

				var promesaCaducidad = promesaInventario
					.then(function (data) {
						var peticiones = inventario.caducidad.map(function (item) {							
							return $http.post(baseUrl+'caducidad/', {
								fecha: formatFecha(item.fecha),
								cantidad: item.cantidad,
								producto: data.producto,
								asociacion: data.asociacion
							});
						});

						return $q.all(peticiones);
					});

				promesaCaducidad
					.then(function (data) {
						deferred.resolve();
					});

				return deferred.promise;		
			}

			function editarInventario (inventario, kardex) {
				var deferred = $q.defer();				
				inventario.cantidad = parseFloat(inventario.cantidad);
				kardex.cantidad = parseFloat(kardex.cantidad);

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
				return asociacionService.getTodos();	
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
				crear: crearInventario,
				editar: editarInventario
			}
		}])
		.factory('reporteService', ['$http', '$q', 'asociacionService', function ($http, $q, asociacionService) {
			function getMeses () {
				var deferred = $q.defer();
				var meses = [{
						id: 1,
						nombre: 'Enero'
					},{
						id: 2,
						nombre: 'Febrero'
					},{
						id: 3,
						nombre: 'Marzo'
					},{
						id: 4,
						nombre: 'Abril'
					},{
						id: 5,
						nombre: 'Mayo'
					},{
						id: 6,
						nombre: 'Junio'
					},{
						id: 7,
						nombre: 'Julio'
					},{
						id: 8,
						nombre: 'Agosto'
					},{
						id: 9,
						nombre: 'Septiembre'
					},{
						id: 10,
						nombre: 'Octubre'
					},{
						id: 11,
						nombre: 'Noviembre'
					},{
						id: 12,
						nombre: 'Diciembre'
					}
				];
				deferred.resolve(meses);
				return deferred.promise;
			}

			function getAsociaciones () {
				return asociacionService.getTodos();
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

			function getCardexInicial (asociacion, mes) {
				var deferred = $q.defer();
				var reportes = [];


				var promesaInventario = $q(function (resolve, reject) {
					$http.get(baseUrl+'inventarios/?inicial=true&asociacion='+asociacion)
						.success(function (data) {
							resolve(data);
						})
						.error(function (error) {
							reject(error);
						});
				});

				var promesaVentas = promesaInventario
					.then(function (inventarios) {

						var peticiones = inventarios.map(function (inventario) {
							reportes.push({
								producto: inventario.producto,
								cantidad_magap: inventario.cantidad_inicial
							});
							return $http.get(baseUrl+'detallesventa/?asociacion='+asociacion+'&mes='+mes+'&producto='+inventario.producto);
						});						
						
						return $q.all(peticiones)
							.then(function (data) {
								return data;
							});						
					});

				var promesaTotales = promesaVentas
					.then(function (alldetalles) {
						reportes.forEach(function (reporte) {
							for(var i = 0; i < alldetalles.length; i++) {
								if(alldetalles[i].config.url.indexOf('producto='+reporte.producto) > -1) {
									var detalles = alldetalles[i].data;
									var suma = 0;
									for(var j = 0; j < detalles.length; j++) {
										suma+=parseFloat(detalles[j].cantidad);
									}
									reporte.cantidad_vendida = suma;
									break;
								}
							}
						});
						return 0;
					});


				var promesaProductos = promesaTotales
					.then(function (data) {
						var peticiones = reportes.map(function (reporte) {
							return $http.get(baseUrl+'productos/'+reporte.producto);
						});

						return $q.all(peticiones)
							.then(function (productos) {
								reportes.forEach(function (reporte) {
									for(var i = 0; i < productos.length; i++) {
										if(productos[i].data.id === reporte.producto) {
											reporte.producto = productos[i].data;
											break;
										}
									}
								});
								return 0;
							});
					});

				promesaProductos
					.then(function (data) {
						deferred.resolve(reportes);
					});

				return deferred.promise;				
			}

			function getReporteGeneral(mes) {
				var deferred = $q.defer();
				var reportes = [];

				getAsociaciones()
					.then(function (asociaciones) {

						asociaciones.forEach(function (asociacion) {
							getVentasMensuales(mes, asociacion.id)
								.then(function (detalles) {
									var suma = 0;
									detalles.forEach(function (detalle) {
										suma+=parseFloat(detalle.precio_total);
									});

									reportes.push({
										asociacion: asociacion,
										total_vendido: suma
									});									
								});
						});

						deferred.resolve(reportes);

					});
					return deferred.promise;
			}

			return {
				getMeses: getMeses,
				getAsociaciones: getAsociaciones,
				getVentasMensuales: getVentasMensuales,
				getCardexInicial: getCardexInicial,
				getReporteGeneral: getReporteGeneral
			}
		}]);
})();