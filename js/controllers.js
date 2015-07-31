(function() {	
	angular.module('botiquin.controllers', [])
		.controller('LoginController', ['$scope', function ($scope) {

		}])
		.controller('AsociacionController',['$scope', '$http',function ($scope, $http){
			$http.get('http://localhost:8000/asociaciones/?tecnico=2')
				.success(function (data) {
					$scope.asociaciones = data;
					$scope.asociaciones.every(function(element, index, array){
						element.tecnico = JSON.parse(element.tecnico);
						element.ubicacion = JSON.parse(element.ubicacion);
						element.map = new Image();
						element.map.src = 'http://maps.googleapis.com/maps/api/staticmap?center='
							+element.latitud+','+element.longitud+'&zoom=17&size=300x200&maptype=hybrid&'
							+'&markers=size:mid|color:blue|label:A|'+element.latitud+','+element.longitud
							+'&sensor=false';
					});
				});
		}])
		.controller('VentasController', ['$scope', '$q', 'ventaService', function ($scope, $q, ventaService) {			
			ventaService.getTodos()
				.then(function (data) {
					$scope.ventas = data;					
				});			
		}])
		.controller('VentaController', ['$scope', '$location', '$modal', '$routeParams','asociacionService', 'ventaService', function ($scope, $location, $modal, $routeParams, asociacionService, ventaService) {
			var idVenta = parseInt($routeParams.id);

			//Declaracion de variables
			$scope.error = false;
			$scope.mensajeError = '';
			$scope.asociaciones = [];
			$scope.venta = {};
			$scope.venta.fecha = new Date();				
			$scope.detalles = [];

			//Acciones constructoras
			if(!isNaN(idVenta)){
				ventaService.getPorId(idVenta)
					.then(function (data) {
						var fecha = data.fecha;
						data.fecha = new Date(fecha);
						data.fecha.setDate(fecha.split('-')[2]);
						$scope.venta = data;						
						$scope.detalles = data.detalles;						
						$scope.detalles.forEach(function (detalle) {
							detalle.valorUnitario = detalle.precio_unitario;
							detalle.valorTotal = detalle.precio_total;
						});						
					});
			}

			asociacionService.getPorTecnico(2)
				.then(function (data) {
					$scope.asociaciones = data;					
				});
			
			//Funciones
			$scope.cancelEnter = function ($event) {
				if($event.keyCode === 13) $event.preventDefault();
			}

			$scope.buscarCliente = function ($event) {
				if($event.keyCode === 13){
					console.log('cliente');
				}
			}

			$scope.seleccionarCliente = function () {			
				$modal.open({					
					templateUrl: 'partials/cliente-dialog.html',
					controller: 'BuscarClienteController',
				}).result.then(function (data) {
					$scope.venta.cliente = data;
				});				
			}

			$scope.seleccionarProducto = function ($index) {
				$modal.open({
					templateUrl: 'partials/producto-dialog.html',
					controller: 'ProductoController',
					size: 'lg'
				}).result.then(function (data) {
					$scope.error = false;

					for(var i in $scope.detalles){
						if($scope.detalles[i].producto.id === data.id){
							$scope.error = true;
							$scope.mensajeError = 'El producto seleccionado ya se encuentra en la lista';	
							return;
						}
					}					

					$scope.detalles[$index].producto = data;
					$scope.detalles[$index].valorUnitario = data.precio_referencial;
					$scope.calcularTotal($index);
				});
			}		
			
			$scope.agregarDetalle = function () {
				$scope.error = false;

				var detalle = {
					cantidad: '1',
					producto: '',
					valorUnitario: '0',
					valorTotal: '',
					usos: [],
					esActual: true
				};

				if($scope.detalles.length > 0){
					var prod = $scope.detalles[0].producto;
					var valt = $scope.detalles[0].valorTotal;
					var emptyUsos = $scope.detalles[0].usos.length <= 0? true:false;
					if(!prod || !valt){
						$scope.error = true;
						$scope.mensajeError = 'Debe llenar todos los campos necesarios';
						return;
					}

					if(emptyUsos){
						$scope.error = true;
						$scope.mensajeError = 'Debe especificar los usos del producto';
						return;	
					}

				}

				$scope.detalles.forEach(function (element) {
					element.esActual = false;
				});

				$scope.detalles.unshift(detalle);
			}

			$scope.editarDetalle = function ($index) {				
				$scope.error = false;

				for(var i=0; i < $scope.detalles.length; i++){
					$scope.detalles[i].esActual = false;
					if((!$scope.detalles[i].producto || !$scope.detalles[i].valorTotal) && $index != i){
						$scope.detalles.splice(i,1);
						if(i < $index) $index = $index -1;
						i = i-1;
					}
				}
							
				$scope.detalles[$index].esActual = true;
			}

			$scope.eliminarDetalle = function ($index) {	
				$scope.error = false;
				$scope.detalles.splice($index, 1);				
			}		

			$scope.calcularTotal = function ($index) {											
				var p = $scope.detalles[$index].valorUnitario;
				var c = $scope.detalles[$index].cantidad;
				$scope.detalles[$index].valorTotal = p * c;
				if(isNaN($scope.detalles[$index].valorTotal)){
					$scope.detalles[$index].valorTotal = "0.00";
				}	
			}

			$scope.seleccionarUsos = function ($index) {
				$scope.detalles[$index].usos.forEach(function (uso) {

				});

				$modal.open({
					templateUrl: 'partials/modal-uso.html',
					controller: 'UsoController',
					resolve: {
						data: function () {
							return $scope.detalles[$index];
						}
					}					
				}).result.then(function (data) {					
					$scope.detalles[$index].usos = data;					
				});
			}

			$scope.seleccionarFecha = function ($event) {
				console.log($scope.venta.fecha.getTime());
				$event.preventDefault;
				$event.stopPropagation();
				$scope.venta.fechaPopup = true;				
			}			

			$scope.guardarVenta = function () {
				$scope.error = false;
				if(!$scope.venta.asociacion) $scope.error = true;
				if(!$scope.venta.cliente) $scope.error = true;
				if(!$scope.venta.fecha) $scope.error = true;

				if($scope.error){
					$scope.mensajeError = 'Debe llenar todos los campos de encabezado.';
					return;
				}

				if($scope.detalles.length < 1){
					$scope.error = true;	
					$scope.mensajeError = 'No ha ingresado detalles de venta.';
					return;
				} 

				for (var i in $scope.detalles) {
					var detalle = $scope.detalles[i];
					if(!detalle.producto || !detalle.valorTotal){
						$scope.error = true;
						$scope.mensajeError = 'La lista de detalles tiene items con campos obligatorios faltantes';
						return;
					}
				}

				for (var i in $scope.detalles) {
					var detalle = $scope.detalles[i];
					if(detalle.usos.length < 1){
						$scope.error = true;
						$scope.mensajeError = 'El item ' + detalle.producto.nombre + ' no tiene USOS resgistrados';
						return;
					}
				}

				var total = 0;
				for(var i in $scope.detalles){
					var detalle = $scope.detalles[i];
					total+=detalle.valorTotal;
				}

				$scope.venta.valor_total = total;				

				ventaService.guardar({
					venta: $scope.venta,
					detalles: $scope.detalles,
				}).then(function () {
					$location.path('/ventas');
				});
			}				
		}])
		.controller('BuscarClienteController', ['$scope', '$modalInstance', 'clienteService', function ($scope, $modalInstance, clienteService) {
			var dataList = {};
			$scope.error = false;
			$scope.mensajeError = '';
			$scope.empty = true;	

			clienteService.getTodos()
				.then(function (data) {
					dataList = data;
					$scope.clientes = data;					
					if(data.length>0){
						$scope.empty = false;
					}
				});

			var contains = function (str, searchString) {
				return str.toLowerCase().indexOf(searchString.toLowerCase()) > -1;
			};

			var startsWith = function (str, searchString) {
				return str.toLowerCase().indexOf(searchString.toLowerCase()) === 0;
			};		

			var filter = function (){
				$scope.empty = true;				
				$scope.clientes = dataList.filter(function (obj) {
					if(startsWith(obj.cedula, $scope.keyword) || contains(obj.nombre, $scope.keyword) || contains(obj.apellido, $scope.keyword)) {
						return obj;
					}
				});

				if($scope.clientes.length > 0){
					$scope.empty = false;
				}
			}			
						
			$scope.filtrarClientes = function (event) {						
				if(!event){
					filter();							
				}else if(event.keyCode === 13){
					filter();
				}						
			};

			$scope.seleccionarCliente = function (cliente) {
				$scope.clienteSeleccionado = cliente;
			}

			$scope.ok = function () {
				if(!$scope.clienteSeleccionado){
					$scope.error = true;
					$scope.mensajeError = 'No ha seleccionado ningun item.';
					return;
				}
				$modalInstance.close($scope.clienteSeleccionado);
			}	

			$scope.cancelar = function () {			
				$modalInstance.dismiss('cancel');
			}		
		}])
		.controller('ClienteController', ['$scope', '$modal', 'clienteService', function ($scope, $modal, clienteService) {
			var dataList = {};
			$scope.error = false;
			$scope.mensajeError = '';
			$scope.empty = true;				

			cargarClientes();

			function cargarClientes () {
				clienteService.getTodos()
					.then(function (data) {
						dataList = data;
						$scope.clientes = data;					
						if(data.length>0){
							$scope.empty = false;
						}
					});
			}

			var contains = function (str, searchString) {
				return str.toLowerCase().indexOf(searchString.toLowerCase()) > -1;
			};

			var startsWith = function (str, searchString) {
				return str.toLowerCase().indexOf(searchString.toLowerCase()) === 0;
			};		

			var filter = function (){
				$scope.empty = true;				
				$scope.clientes = dataList.filter(function (obj) {
					if(startsWith(obj.cedula, $scope.keyword) || contains(obj.nombre, $scope.keyword) || contains(obj.apellido, $scope.keyword)) {
						return obj;
					}
				});

				if($scope.clientes.length > 0){
					$scope.empty = false;
				}
			}			
						
			$scope.filtrarClientes = function (event) {						
				if(!event){
					filter();							
				}else if(event.keyCode === 13){
					filter();
				}						
			};

			$scope.abrirNuevo = function () {
				$modal.open({					
					templateUrl: 'partials/modal-cliente.html',
					controller: 'ModalClienteController',
					resolve: {
						data : function () {
							return null;
						}
					}
				}).result.then(function (data) {
					cargarClientes();
				});
			} 	

			$scope.abrirEditar = function ($index) {
				$modal.open({					
					templateUrl: 'partials/modal-cliente.html',
					controller: 'ModalClienteController',
					resolve: {
						data: function () {
							return $scope.clientes[$index];
						}
					}
				}).result.then(function (data) {
					cargarClientes();
				});
			} 	
		}])
		.controller('ModalClienteController', ['$scope', '$modalInstance','clienteService', 'data', function ($scope, $modalInstance, clienteService, data) {
			
			$scope.cliente = {};			
			$scope.nuevo = data!=null?false:true;
			$scope.error = false;
			$scope.mensajeError = '';

			if(data) {
				$scope.cliente = {
					id: data.id,
					cedula: data.cedula,
					nombre: data.nombre,
					apellido: data.apellido
				}
			}

			function validarDatos () {
				if(!$scope.cliente.cedula || !$scope.cliente.nombre || !$scope.cliente.apellido) return false;
				return true;
			}

			$scope.guardar = function () {
				if(validarDatos()) {					
					clienteService.crear($scope.cliente)
						.then(function (data) {
							$modalInstance.close(data);
						}); 
				}else{
					$scope.error = true;
					$scope.mensajeError = 'Todos lo campos son requeridos.';
				}
			}

			$scope.editar = function () {
				if(validarDatos()) {					
					clienteService.editar($scope.cliente)
						.then(function (data) {
							$modalInstance.close(data);
						}); 
				}else{
					$scope.error = true;
					$scope.mensajeError = 'Todos lo campos son requeridos.';
				}
			}

			$scope.cancelar = function () {			
				$modalInstance.dismiss('cancel');
			}
		}])
		.controller('ProductoController', ['$scope', '$modalInstance', 'productoService', function ($scope, $modalInstance, productoService) {
			var dataList = {};
			$scope.productos = [];					
			$scope.error = false;
			$scope.mensajeError = '';
			$scope.empty = true;

			var contains = function (str, searchString) {
				return str.toLowerCase().indexOf(searchString.toLowerCase()) > -1;
			};

			var startsWith = function (str, searchString) {
				return str.toLowerCase().indexOf(searchString.toLowerCase()) === 0;
			};		

			var filter = function (){
				$scope.empty = true;
				$scope.productos = dataList.filter(function (obj) {
					if(contains(obj.nombre, $scope.keyword) || contains(obj.compuesto, $scope.keyword) 
						|| contains(obj.presentacion, $scope.keyword) || contains(obj.registro_sanitario, $scope.keyword)) {
						return obj;
					}
				});

				if($scope.productos.length > 0){
					$scope.empty = false;
				}
			}			
						

			productoService.getTodos()
				.then(function (data) {
					dataList = data;
					$scope.productos = data;
					if(data.length>0){
						$scope.empty = false;
					}
				});					


			$scope.filtrarProductos = function (event) {						
				if(!event){
					filter();							
				}else if(event.keyCode === 13){
					filter();
				}						
			};

			$scope.seleccionarProducto = function (producto) {
				$scope.productoSeleccionado = producto;
			}

			$scope.ok = function () {				
				if(!$scope.productoSeleccionado){
					$scope.error = true;
					$scope.mensajeError = 'No ha seleccionado ningun item.';
					return;
				}
				$modalInstance.close($scope.productoSeleccionado);
			}

			$scope.cancelar = function () {			
				$modalInstance.dismiss('cancel');
			}	
		}])
		.controller('UsoController', ['$scope', '$modalInstance', 'enfermedadService', 'especieService', 'data', function ($scope, $modalInstance, enfermedadService, especieService, data) {
			$scope.detalle = data;
			$scope.uso = {
				cantidad: $scope.detalle.cantidad,
				enfermedad: '',
				especie: ''
			};
			$scope.usos = data.usos;
			$scope.enfermedades = [];
			$scope.especies = [];	
			$scope.error = false;
			$scope.mensajeError = '';

			enfermedadService.getTodos()
				.then(function (data) {
					$scope.enfermedades = data;					

					$scope.usos.forEach(function (uso) {						
						for(var i = 0; i < $scope.enfermedades.length; i++) {
							var enfermedad = $scope.enfermedades[i];					
							if(enfermedad.id == uso.enfermedad){
								uso.enfermedadSelected = enfermedad;
								break;
							}
						}					
					});
				});

			especieService.getTodos()
				.then(function (data) {
					$scope.especies = data;

					$scope.usos.forEach(function (uso) {												
						for(var i = 0; i < $scope.especies.length; i++) {
							var especie = $scope.especies[i];
							if(especie.id == uso.especie){
								uso.especieSelected = especie;
								break;
							}
						}
					});
				});

			$scope.usos.forEach(function (element) {
				element.esActual = false;
			});			

			$scope.agregarUso = function () {				
				$scope.error = false;	

				$scope.usos.forEach(function (uso) {
					uso.esActual = false;					
				});				

				for(propiedad in $scope.uso){						
					if($scope.uso[propiedad]){
						$('#'+ propiedad +'Usos').removeClass('has-error');						
					}else{
						$('#'+ propiedad +'Usos').addClass('has-error');	
						$scope.error = true;										
					}
				}					
				
				if($scope.error){
					$scope.mensajeError = 'Todos lo campos son necesarios.';
					return;
				} 				

				for (var i in $scope.usos) {
					var uso = $scope.usos[i];						
					if(uso.enfermedad.nombre===$scope.uso.enfermedad.nombre
						&& uso.especie.nombre===$scope.uso.especie.nombre){
						$scope.error = true;
						$scope.mensajeError = 'Los datos seleccionados ya se encuentran en la lista.';
						return;
					}
				}				

				for(var i = 0; i < $scope.enfermedades.length; i++) {
					var enfermedad = $scope.enfermedades[i];					
					if(enfermedad.id == $scope.uso.enfermedad){
						$scope.uso.enfermedadSelected = enfermedad;
						break;
					}
				}

				for(var i = 0; i < $scope.especies.length; i++) {
					var especie = $scope.especies[i];
					if(especie.id == $scope.uso.especie){
						$scope.uso.especieSelected = especie;
						break;
					}
				}

				$scope.usos.push($scope.uso);				
				$scope.uso = {
					cantidad: '',
					enfermedad: '',
					especie: ''
				};
			}

			$scope.editarUso = function ($index) {
				$scope.usos.forEach(function (uso) {
					uso.esActual = false;
				});

				$scope.usos[$index].esActual = true;
			}

			$scope.eliminarUso = function ($index) {
				$scope.usos.forEach(function (uso) {
					uso.esActual = false;					
				});	
				$scope.usos.splice($index, 1);
			}

			$scope.ok = function () {				
				if($scope.usos.length <= 0){
					$scope.error = true;
					$scope.mensajeError = 'No ha ingresado items.';
					return;
				}
				$modalInstance.close($scope.usos);
			}

			$scope.cancelar = function () {			
				$modalInstance.dismiss('cancel');
			}
		}])
		.controller('ComprasController', ['$scope', 'compraService', function ($scope, compraService) {
			$scope.compras = [];			

			compraService.getTodos()
				.then(function (data) {
					$scope.compras = data;
				});
		}])
		.controller('CompraController', ['$scope', '$modal', '$location', '$routeParams', 'compraService', 'asociacionService', function ($scope, $modal, $location, $routeParams, compraService, asociacionService) {
			var idCompra = parseInt($routeParams.id);

			$scope.asociaciones = [];
			$scope.compra = {};
			$scope.compra.fecha = new Date();
			$scope.detalles = [];
			$scope.error = false;
			$scope.mensajeError = '';

			if(!isNaN(idCompra)){
				compraService.getPorId(idCompra)
					.then(function (data) {
						var fecha = data.compra.fecha;
						data.compra.fecha = new Date(fecha);
						data.compra.fecha.setDate(fecha.split('-')[2]);
						$scope.compra = data.compra;						
						$scope.detalles = data.detalles;						
						$scope.detalles.forEach(function (detalle) {
							detalle.valorUnitario = detalle.costo_unitario;
							detalle.valorTotal = detalle.costo_total;
						});						
					});
			}

			asociacionService.getTodos()
				.then(function (data) {
					$scope.asociaciones = data;
				});

			$scope.cancelEnter = function ($event) {
				if($event.keyCode === 13) $event.preventDefault();
			}

			$scope.seleccionarProducto = function ($index) {
				$modal.open({
					templateUrl: 'partials/producto-dialog.html',
					controller: 'ProductoController',
					size: 'lg'
				}).result.then(function (data) {
					$scope.error = false;

					for(var i in $scope.detalles){
						if($scope.detalles[i].producto.id === data.id){
							$scope.error = true;
							$scope.mensajeError = 'El producto seleccionado ya se encuentra en la lista';	
							return;
						}
					}					

					$scope.detalles[$index].producto = data;
					$scope.detalles[$index].valorUnitario = data.precio_referencial;
					$scope.calcularTotal($index);
				});
			}		
			
			$scope.agregarDetalle = function () {
				$scope.error = false;

				var detalle = {
					cantidad: '1',
					producto: '',
					valorUnitario: '0',
					valorTotal: '',					
					esActual: true
				};

				if($scope.detalles.length > 0){
					var prod = $scope.detalles[0].producto;
					var valt = $scope.detalles[0].valorTotal;

					if(!prod || !valt){
						$scope.error = true;
						$scope.mensajeError = 'Debe llenar todos los campos necesarios';
						return;
					}					
				}

				$scope.detalles.forEach(function (element) {
					element.esActual = false;
				});

				$scope.detalles.unshift(detalle);
			}

			$scope.editarDetalle = function ($index) {				
				$scope.error = false;

				for(var i=0; i < $scope.detalles.length; i++){
					$scope.detalles[i].esActual = false;
					if((!$scope.detalles[i].producto || !$scope.detalles[i].valorTotal) && $index != i){
						$scope.detalles.splice(i,1);
						if(i < $index) $index = $index -1;
						i = i-1;
					}
				}
							
				$scope.detalles[$index].esActual = true;
			}

			$scope.eliminarDetalle = function ($index) {	
				$scope.error = false;
				$scope.detalles.splice($index, 1);				
			}		

			$scope.calcularTotal = function ($index) {											
				var p = $scope.detalles[$index].valorUnitario;
				var c = $scope.detalles[$index].cantidad;
				$scope.detalles[$index].valorTotal = p * c;
				if(isNaN($scope.detalles[$index].valorTotal)){
					$scope.detalles[$index].valorTotal = "0.00";
				}	
			}

			$scope.guardar = function () {
				$scope.error = false;
				if(!$scope.compra.asociacion) $scope.error = true;				
				if(!$scope.compra.fecha) $scope.error = true;

				if($scope.error){
					$scope.mensajeError = 'Debe llenar todos los campos de encabezado.';
					return;
				}

				if($scope.detalles.length < 1){
					$scope.error = true;	
					$scope.mensajeError = 'No ha ingresado detalles de venta.';
					return;
				} 

				for (var i in $scope.detalles) {
					var detalle = $scope.detalles[i];
					if(!detalle.producto || !detalle.valorTotal){
						$scope.error = true;
						$scope.mensajeError = 'La lista de detalles tiene items con campos obligatorios faltantes';
						return;
					}
				}

				var total = 0;
				for(var i in $scope.detalles){
					var detalle = $scope.detalles[i];
					total+=detalle.valorTotal;
				}

				$scope.compra.valor_total = total;				

				compraService.guardar({
					compra: $scope.compra,
					detalles: $scope.detalles,
				}).then(function () {
					$location.path('/compras');
				});
			}
		}])
		.controller('InventariosController', ['$scope', '$modal', 'inventarioService', function ($scope, $modal, inventarioService) {
			$scope.inventarios = [];
			$scope.error = false;
			$scope.mensajeError = '';

			inventarioService.getTodos()
				.then(function (data) {
					$scope.inventarios = data;
				});
		}])
		.controller('InventarioController', ['$scope', '$modal', '$location', 'inventarioService', function ($scope, $modal, $location, inventarioService) {
			$scope.kardex = {};
			$scope.kardex.fecha = new Date();
			$scope.asociaciones = [];
			$scope.error = false;
			$scope.mensajeError = '';

			$scope.transacciones = [
				'Compra',
				'Venta',
				'Inventario inicial',
				'Devolución',
				'Regalo',
				'Otros'
			];

			inventarioService.getAsociaciones()
				.then(function (data) {
					$scope.asociaciones = data;
				});

			$scope.seleccionarProducto = function () {
				$modal.open({
					templateUrl: 'partials/producto-dialog.html',
					controller: 'ProductoController',
					size: 'lg'
				}).result.then(function (data) {			
					$scope.kardex.producto = data;
					$scope.kardex.valor_unitario = data.precio_referencial;
					$scope.calcularTotal();
				});
			}

			$scope.calcularTotal = function () {																		
				$scope.kardex.valor_total = $scope.kardex.cantidad * $scope.kardex.valor_unitario;
				if(isNaN($scope.kardex.valor_total)){
					$scope.kardex.valor_total = 0;
				}	
			}

			$scope.guardar = function() {
				inventarioService.getPorAsociacionProducto($scope.kardex.asociacion, $scope.kardex.producto.id)
					.then(function (data) {
						if(!data.hasOwnProperty('id')) crear();
						else editar(data);
					});				
			}

			function crear () {
				inventarioService.guardar($scope.kardex)
					.then(function () {
						$location.path('/inventarios');
					});
			}

			function editar (inventario) {				
				inventarioService.editar(inventario, $scope.kardex)
					.then(function () {
						$location.path('/inventarios');
					});
			}
		}])
		.controller('RComercialController', ['$scope', '$routeParams','reporteService', function ($scope, $routeParams, reporteService) {
			$scope.asociacion = {};
			$scope.detalles = [];
			$scope.mostrar = false;
			$scope.opciones = {};
	
			reporteService.getMeses()
				.then(function (data) {
					$scope.meses = data;
				});

			reporteService.getAsociaciones()
				.then(function (data) {
					$scope.asociaciones = data;
				});


			$scope.generar = function () {
				reporteService.getVentasMensuales($scope.opciones.mes, $scope.opciones.asociacion)
					.then(function (data) {
						$scope.detalles = data;
						$scope.mostrar = true;

						for(var i = 0; i < $scope.asociaciones.length; i++) {
							if($scope.asociaciones[i].id == $scope.opciones.asociacion) {
								$scope.asociacion = $scope.asociaciones[i];
								break;
							}
						}
					});
			}

		}])
		.controller('RKardexController', ['$scope', '$routeParams','reporteService', function ($scope, $routeParams, reporteService) {
			$scope.asociacion = {};
			$scope.detalles = [];
			$scope.mostrar = false;
			$scope.opciones = {};
			
			reporteService.getMeses()
				.then(function (data) {
					$scope.meses = data;
				});

			reporteService.getAsociaciones()
				.then(function (data) {
					$scope.asociaciones = data;
				});

			$scope.generar = function () {
				reporteService.getVentasProducto($scope.opciones.asociacion, $scope.opciones.mes)
					.then(function (data) {
						$scope.detalles = data;
						$scope.mostrar = true;

						for(var i = 0; i < $scope.asociaciones.length; i++) {
							if($scope.asociaciones[i].id == $scope.opciones.asociacion) {
								$scope.asociacion = $scope.asociaciones[i];
								break;
							}
						}
					});					
			}

		}]);
})();