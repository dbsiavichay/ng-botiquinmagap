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

			function getVentaTodos () {
				var deferred = $q.defer();

				var promesa = $q(function (resolve, reject) {
					$http.get(baseUrl+'ventas/')
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
							detalle.producto = detalle.producto.id;
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
											inventario.valor_unitario = parseFloat(detalle.precio_unitario);
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
								});
						});

						deferred.resolve();						
					});				

				return deferred.promise;
			}			

			function getClientePorCedula(cedula) {
				return clienteService.getPorCedula(cedula);
			}
			
			return {
				getPorId: getVentaPorId,
				getTodos: getVentaTodos,
				crear: crear,				
				getClientePorCedula: getClientePorCedula
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
		.factory('compraService', ['$http', '$q', function ($http, $q) {
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

			function getCompraTodos () {
				var deferred = $q.defer();

				var promesa = $q(function (resolve, reject) {
					$http.get(baseUrl+'compras/')
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
								});
						});

						deferred.resolve();						
					});				

				return deferred.promise;
			}
			
			return {	
				getPorId: getCompraPorId,			
				getTodos: getCompraTodos,
				crear: crear
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

			function getVentasProducto (asociacion, mes) {
				var deferred = $q.defer();
				var reportes = [];

				$http.get(baseUrl+'kardexs/?inicial=true&asociacion='+asociacion)
					.success(function (data) {
						var kardexs = data;						
						var peticiones = kardexs.map(function (kardex) {
							reportes.push({producto: kardex.producto, cantidad_magap: parseFloat(kardex.cantidad)});
							return $http.get(baseUrl+'detallesventa/?asociacion='+asociacion+'&mes='+mes+'&producto='+kardex.producto);
						});

						$q.all(peticiones)
							.then(function (data) {
								data.forEach(function (detalleslist) {
									var detalles = detalleslist.data;
									var suma = 0;
									detalles.forEach(function (detalle) {
										suma+=parseFloat(detalle.cantidad);
									});
									
									if(detalles.length > 0) {										
										for(var i = 0; i < reportes.length; i++) {											
											if(detalles[0].producto === reportes[i].producto) {
												reportes[i].cantidad_vendida = suma;
												break;
											}
										}
									}									
								});

								var petsproductos = reportes.map(function (reporte) {
									if(!reporte.cantidad_vendida) reporte.cantidad_vendida = 0;
									return $http.get(baseUrl+'productos/'+reporte.producto)
								});

								$q.all(petsproductos)
									.then(function (productos) {
										reportes.forEach(function (reporte) {
											for(var i = 0; i < productos.length; i++) {
												if(reporte.producto === productos[i].data.id) {
													reporte.producto = productos[i].data;
													break;
												}
											}
										});
										deferred.resolve(reportes);
									});
							});		
					});
				return deferred.promise;				
			}

			return {
				getMeses: getMeses,
				getAsociaciones: getAsociaciones,
				getVentasMensuales: getVentasMensuales,
				getVentasProducto: getVentasProducto
			}
		}]);
})();