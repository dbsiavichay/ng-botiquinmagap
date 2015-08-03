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
		.controller('VentasController', ['$scope', '$modal', 'ventaService', function ($scope, $modal, ventaService) {			
			$scope.asociacionSelected = {};			

			ventaService.getAsociaciones()
				.then(function (data) {
					$scope.asociaciones = data;
					$scope.asociacionSelected = data[0];
					ventaService.getTodos($scope.asociacionSelected.id)
						.then(function (data) {
							$scope.ventas = data;					
						});
				});

			$scope.cargarVentas = function () {
				ventaService.getTodos($scope.asociacionSelected.id)
					.then(function (data) {
						$scope.ventas = data;					
					});
			}


			$scope.ver = function ($index) {				
				$modal.open({					
					templateUrl: 'partials/modal-venta.html',
					controller: 'ModalVentaController',
					size: 'lg',
					resolve: {
						data: function () {							
							return $scope.ventas[$index].id;
						}
					}
				});
			}			
		}])
		.controller('VentaController', ['$scope', '$location', '$modal', '$routeParams','asociacionService', 'ventaService', function ($scope, $location, $modal, $routeParams, asociacionService, ventaService) {						
			var idVenta = parseInt($routeParams.id);

			//Declaracion de variables
			$scope.error = false;
			$scope.mensajeError = '';
			$scope.asociaciones = [];
			$scope.venta = {};
			$scope.venta.detalles = [];
			$scope.venta.fecha = new Date();								

			//Acciones constructoras
			if(!isNaN(idVenta)){				
				ventaService.getPorId(idVenta)
					.then(function (data) {
						var fecha = data.fecha;
						data.fecha = new Date(fecha);
						data.fecha.setDate(fecha.split('-')[2]);
						$scope.venta = data;										
					});
			}

			asociacionService.getPorTecnico(2)
				.then(function (data) {
					$scope.asociaciones = data;					
				});
			
			
			//Funciones	
			$scope.cancelEnter = function($event) {
				if($event.keyCode === 13) $event.preventDefault();
			}

			$scope.buscarCliente = function ($event) {				
				if($event.keyCode === 13){
					$scope.error = false;
					var cedula = $('#txtCedula').val();
					if(!cedula) return;
					ventaService.getClientePorCedula(cedula)
						.then(function (data) {
							if(!data) {
								$scope.error = true;
								$scope.mensajeError = 'No existe cliente con data <'+cedula+'>'
								return;
							}

							$scope.venta.cliente = data;
							$('#txtCedula').val('');
						});
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
				if(!$scope.venta.asociacion) {
					$scope.error = true;
					$scope.mensajeError = 'Es necesario especificar la ASOCIACION en el encabezado.';
					return;
				}

				$modal.open({
					templateUrl: 'partials/modal-inventario.html',
					controller: 'ModalInventarioController',
					size: 'lg',
					resolve: {
						data: function () {
							return $scope.venta.asociacion.id							
						}
					}
				}).result.then(function (data) {
					$scope.error = false;

					if(parseFloat(data.cantidad) <= 0) {
						$scope.error = true;
						$scope.mensajeError = 'El producto seleccionado no tiene stock.';
						return;
					}

					for(var i in $scope.venta.detalles){
						if($scope.venta.detalles[i].inventario.id === data.id){
							$scope.error = true;
							$scope.mensajeError = 'El producto seleccionado ya se encuentra en la lista';	
							return;
						}
					}					

					$scope.venta.detalles[$index].inventario = data;
					$scope.venta.detalles[$index].precio_unitario = data.valor_unitario;
					$scope.calcularTotal($index);
				});
			}		
			
			$scope.agregarDetalle = function () {
				$scope.error = false;				

				var detalle = {
					cantidad: '1',
					inventario: '',
					precio_unitario: '0',
					precio_total: '',
					usos: [],
					caducidad: [],
					esActual: true
				};

				if($scope.venta.detalles.length > 0){
					var prod = $scope.venta.detalles[0].inventario;
					var valt = $scope.venta.detalles[0].precio_total;
					var emptyUsos = $scope.venta.detalles[0].usos.length <= 0? true:false;
					var emptyCaducidad = $scope.venta.detalles[0].caducidad.length <= 0? true:false;
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

					if(emptyCaducidad){
						$scope.error = true;
						$scope.mensajeError = 'Debe especificar las caducidades del producto';
						return;	
					}

				}

				$scope.venta.detalles.forEach(function (element) {
					element.esActual = false;
				});

				$scope.venta.detalles.unshift(detalle);				
			}

			$scope.editarDetalle = function ($index) {				
				$scope.error = false;

				for(var i=0; i < $scope.venta.detalles.length; i++){
					$scope.venta.detalles[i].esActual = false;
					if((!$scope.venta.detalles[i].producto || !$scope.venta.detalles[i].precio_total) && $index != i){
						$scope.venta.detalles.splice(i,1);
						if(i < $index) $index = $index -1;
						i = i-1;
					}
				}
							
				$scope.venta.detalles[$index].esActual = true;
			}

			$scope.eliminarDetalle = function ($index) {	
				$scope.error = false;
				$scope.venta.detalles.splice($index, 1);				
			}		

			$scope.calcularTotal = function ($index) {											
				var p = $scope.venta.detalles[$index].precio_unitario;
				var c = $scope.venta.detalles[$index].cantidad;
				$scope.venta.detalles[$index].precio_total = p * c;
				if(isNaN($scope.venta.detalles[$index].precio_total)){
					$scope.venta.detalles[$index].precio_total = "0.00";
				}	
			}

			$scope.seleccionarUsos = function ($index) {
				$modal.open({
					templateUrl: 'partials/modal-usos.html',
					controller: 'ModalUsoController',
					resolve: {
						data: function () {
							return $scope.venta.detalles[$index];
						}
					}					
				}).result.then(function (data) {					
					$scope.venta.detalles[$index].usos = data;					
				});
			}

			$scope.agregarCaducidad = function ($index) {	
				$scope.error = false;
				if(!$scope.venta.detalles[$index].inventario) {
					$scope.error = true;
					$scope.mensajeError = 'Debe seleccionar un producto.';
					return;
				}

				$modal.open({
					templateUrl: 'partials/modal-caducidad.html',
					controller: 'ModalCaducidadController',
					resolve: {
						data : function () {
							return {
								caducidades : $scope.venta.detalles[$index].caducidad,
								fechas: $scope.venta.detalles[$index].inventario.caducidades
							}
						}
					}					
				}).result.then(function (data) {					
					$scope.venta.detalles[$index].caducidad = data;					
				});
			}

			$scope.seleccionarFecha = function ($event) {
				console.log($scope.venta.fecha.getTime());
				$event.preventDefault;
				$event.stopPropagation();
				$scope.venta.fechaPopup = true;				
			}		

			function validarDatos () {
				$scope.error = false;
				if(!$scope.venta.asociacion) $scope.error = true;
				if(!$scope.venta.cliente) $scope.error = true;
				if(!$scope.venta.fecha) $scope.error = true;

				if($scope.error){
					$scope.mensajeError = 'Debe llenar todos los campos de encabezado.';
					return false;
				}

				if($scope.venta.detalles.length < 1){
					$scope.error = true;	
					$scope.mensajeError = 'No ha ingresado detalles de venta.';
					return false;
				} 

				for (var i in $scope.venta.detalles) {
					var detalle = $scope.venta.detalles[i];
					if(!detalle.inventario || !detalle.precio_total){
						$scope.error = true;
						$scope.mensajeError = 'La lista de detalles tiene items con campos obligatorios faltantes';
						return false;
					}
				}

				for (var i in $scope.venta.detalles) {
					var detalle = $scope.venta.detalles[i];
					if(detalle.usos.length < 1){
						$scope.error = true;
						$scope.mensajeError = 'El item ' + detalle.inventario.producto.nombre + ' no tiene USOS registrados';
						return false;
					}
				}

				for (var i in $scope.venta.detalles) {
					var detalle = $scope.venta.detalles[i];
					if(detalle.caducidad.length < 1){
						$scope.error = true;
						$scope.mensajeError = 'El item ' + detalle.inventario.producto.nombre + ' no tiene CADUCIDAD resgistrados';
						return false;
					}
				}

				return true;
			}	

			$scope.guardarVenta = function () {
				if(!validarDatos()) return;
				var total = 0;
				for(var i in $scope.venta.detalles){
					var detalle = $scope.venta.detalles[i];
					total+=parseFloat(detalle.precio_total);
				}

				$scope.venta.valor_total = total;				

				ventaService.crear($scope.venta)
					.then(function () {
						$location.path('/ventas');
					});
			}
		}])
		.controller('ModalVentaController', ['$scope', '$modalInstance', 'ventaService', 'data', function ($scope, $modalInstance, ventaService, data) {
			var id = data;
			ventaService.getPorId(id)
				.then(function (data) {
					$scope.venta = data;					
				});

			$scope.cancelar = function () {			
				$modalInstance.dismiss('cancel');
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
		.controller('ModalUsoController', ['$scope', '$modalInstance', 'enfermedadService', 'especieService', 'data', function ($scope, $modalInstance, enfermedadService, especieService, data) {
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
				});

			especieService.getTodos()
				.then(function (data) {
					$scope.especies = data;
				});		

			$scope.agregarUso = function () {				
				$scope.error = false;				

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
					if(uso.enfermedad.id===$scope.uso.enfermedad.id
						&& uso.especie.id===$scope.uso.especie.id){
						$scope.error = true;
						$scope.mensajeError = 'Los datos seleccionados ya se encuentran en la lista.';
						return;
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
		.controller('ComprasController', ['$scope', '$modal', 'compraService', function ($scope, $modal, compraService) {
			$scope.asociacionSelected = {};			

			compraService.getAsociaciones()
				.then(function (data) {
					$scope.asociaciones = data;
					$scope.asociacionSelected = data[0];
					compraService.getTodos($scope.asociacionSelected.id)
						.then(function (data) {
							$scope.compras = data;
						});					
				});

			$scope.cargarCompras = function () {
				compraService.getTodos($scope.asociacionSelected.id)
					.then(function (data) {
						$scope.compras = data;
					});	
			}


			$scope.ver = function ($index) {				
				$modal.open({					
					templateUrl: 'partials/modal-compra.html',
					controller: 'ModalCompraController',
					size: 'lg',
					resolve: {
						data: function () {							
							return $scope.compras[$index].id;
						}
					}
				});
			}
		}])
		.controller('CompraController', ['$scope', '$modal', '$location', '$routeParams', 'compraService', function ($scope, $modal, $location, $routeParams, compraService) {
			var idCompra = parseInt($routeParams.id);

			$scope.asociaciones = [];
			$scope.compra = {};
			$scope.compra.detalles = [];
			$scope.compra.fecha = new Date();			
			$scope.error = false;
			$scope.mensajeError = '';

			if(!isNaN(idCompra)){
				compraService.getPorId(idCompra)
					.then(function (data) {
						var fecha = data.compra.fecha;
						data.compra.fecha = new Date(fecha);
						data.compra.fecha.setDate(fecha.split('-')[2]);
					});
			}

			compraService.getAsociaciones()
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

					for(var i in $scope.compra.detalles){
						if($scope.compra.detalles[i].producto.id === data.id){
							$scope.error = true;
							$scope.mensajeError = 'El producto seleccionado ya se encuentra en la lista';	
							return;
						}
					}					

					$scope.compra.detalles[$index].producto = data;
					$scope.compra.detalles[$index].costo_unitario = data.precio_referencial;
					$scope.calcularTotal($index);
				});
			}		
			
			$scope.agregarDetalle = function () {
				$scope.error = false;

				var detalle = {
					cantidad: '1',
					producto: '',
					costo_unitario: '0',
					costo_total: '',
					caducidad: [],
					esActual: true
				};				

				if($scope.compra.detalles.length > 0){
					var prod = $scope.compra.detalles[0].producto;
					var valt = $scope.compra.detalles[0].costo_total;
					var emptyCaducidad = $scope.compra.detalles[0].caducidad.length;

					if(!prod || !valt){
						$scope.error = true;
						$scope.mensajeError = 'Debe llenar todos los campos necesarios';
						return;
					}					

					if(!emptyCaducidad) {
						$scope.error = true;
						$scope.mensajeError = 'Debe especificar las caducidades del producto';
						return;
					}
				}				

				$scope.compra.detalles.forEach(function (element) {
					element.esActual = false;
				});

				$scope.compra.detalles.unshift(detalle);
			}

			$scope.editarDetalle = function ($index) {				
				$scope.error = false;

				for(var i=0; i < $scope.compra.detalles.length; i++){
					$scope.compra.detalles[i].esActual = false;
					if((!$scope.compra.detalles[i].producto || !$scope.compra.detalles[i].costo_total) && $index != i){
						$scope.compra.detalles.splice(i,1);
						if(i < $index) $index = $index -1;
						i = i-1;
					}
				}
							
				$scope.compra.detalles[$index].esActual = true;
			}

			$scope.eliminarDetalle = function ($index) {	
				$scope.error = false;
				$scope.compra.detalles.splice($index, 1);				
			}		


			$scope.agregarCaducidad = function ($index) {	
				$scope.error = false;
				if(!$scope.compra.detalles[$index].producto) {
					$scope.error = true;
					$scope.mensajeError = 'Debe seleccionar un producto.';
					return;
				}

				$modal.open({
					templateUrl: 'partials/modal-caducidad.html',
					controller: 'ModalCaducidadController',
					resolve: {
						data : function () {
							return {
								caducidades : $scope.compra.detalles[$index].caducidad								
							}
						}
					}					
				}).result.then(function (data) {					
					$scope.compra.detalles[$index].caducidad = data;					
				});
			}

			$scope.calcularTotal = function ($index) {											
				var p = $scope.compra.detalles[$index].costo_unitario;
				var c = $scope.compra.detalles[$index].cantidad;
				$scope.compra.detalles[$index].costo_total = p * c;
				if(isNaN($scope.compra.detalles[$index].costo_total)){
					$scope.compra.detalles[$index].costo_total = "0.00";
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

				if($scope.compra.detalles.length < 1){
					$scope.error = true;	
					$scope.mensajeError = 'No ha ingresado detalles de compra.';
					return;
				} 

				for (var i in $scope.compra.detalles) {
					var detalle = $scope.compra.detalles[i];
					if(!detalle.producto || !detalle.costo_total){
						$scope.error = true;
						$scope.mensajeError = 'La lista de detalles tiene items con campos obligatorios faltantes';
						return;
					}
				}

				for (var i in $scope.compra.detalles) {
					var detalle = $scope.compra.detalles[i];
					if(detalle.caducidad.length < 1){
						$scope.error = true;
						$scope.mensajeError = 'El item ' + detalle.producto.nombre + ' no tiene CADUCIDAD resgistrados';
						return;
					}
				}

				var total = 0;
				for(var i in $scope.compra.detalles){
					var detalle = $scope.compra.detalles[i];
					total+=parseFloat(detalle.costo_total);
				}

				$scope.compra.valor_total = total;				

				compraService.crear($scope.compra)
					.then(function () {
						$location.path('/compras');
					});
			}
		}])
		.controller('ModalCompraController', ['$scope', '$modalInstance', 'compraService', 'data', function ($scope, $modalInstance, compraService, data) {
			var id = data;
			compraService.getPorId(id)
				.then(function (data) {
					$scope.compra = data;					
				});

			$scope.cancelar = function () {			
				$modalInstance.dismiss('cancel');
			}		
		}])
		.controller('InventariosController', ['$scope', '$modal', 'inventarioService', function ($scope, $modal, inventarioService) {
			$scope.asociacionSelected = {};
			$scope.error = false;
			$scope.mensajeError = '';

			inventarioService.getAsociaciones()
				.then(function (data) {
					$scope.asociaciones = data;
					$scope.asociacionSelected = data[0];
					
					inventarioService.getTodos($scope.asociacionSelected.id)
						.then(function (data) {
							$scope.inventarios = data;
						});
				});

			$scope.cargarInventario = function () {
				inventarioService.getTodos($scope.asociacionSelected.id)
					.then(function (data) {
						$scope.inventarios = data;
					});
			}

		}])
		.controller('InventarioController', ['$scope', '$modal', '$location', 'inventarioService', function ($scope, $modal, $location, inventarioService) {
			$scope.inventario = {};
			$scope.inventario.es_inicial = true;			
			$scope.inventario.caducidad = [];
			$scope.caducidad = {};
			$scope.error = false;
			$scope.mensajeError = '';

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
					$scope.inventario.producto = data;
					$scope.inventario.valor_unitario = data.precio_referencial;
					$scope.calcularTotal();
				});
			}

			$scope.calcularTotal = function () {																		
				$scope.inventario.valor_total = $scope.inventario.cantidad * $scope.inventario.valor_unitario;
				if(isNaN($scope.inventario.valor_total)){
					$scope.inventario.valor_total = 0;
				}	
			}

			$scope.agregarCaducidad = function () {
				$scope.error = false;
				if(!validarCampos()) {
					$scope.error = true;
					$scope.mensajeError = 'Antes debe registrar los campos a su izquierda.';
					return;
				}

				if(!$scope.caducidad.cantidad) $scope.error = true;
				if(parseFloat($scope.caducidad.cantidad) <= 0) $scope.error = true;
				if(!$scope.caducidad.fecha) $scope.error = true;				

				if($scope.error) {					
					$scope.mensajeError = 'Los campos de CANTIDAD y FECHA son requeridos.';	
					return;
				}
				
				$scope.inventario.caducidad.push($scope.caducidad);
				$scope.caducidad = {};
			}

			$scope.removerCaducidad = function ($index) {
				$scope.inventario.caducidad.splice($index, 1);
			}

			function validarCampos () {
				$scope.error = false;				
				if(!$scope.inventario.asociacion) $scope.error = true;
				if(!$scope.inventario.es_inicial) $scope.error = true;				
				if(!$scope.inventario.cantidad) $scope.error = true;
				if(parseFloat($scope.inventario.cantidad) <= 0) $scope.error = true;
				if(!$scope.inventario.producto) $scope.error = true;
				if(!$scope.inventario.valor_unitario) $scope.error = true;

				if($scope.error) {
					$scope.mensajeError = 'Todos los campos son obligatorios';
					return false;
				}
				return true;
			}

			$scope.guardar = function() {
				if(!validarCampos()) return;

				if(!$scope.inventario.caducidad.length) {
					$scope.error = true;
					$scope.mensajeError = 'Debe registrar la caducidad de los productos.';
					return;	
				}

				$scope.inventario.cantidad_inicial = $scope.inventario.cantidad;

				inventarioService.getPorAsociacionProducto($scope.inventario.asociacion.id, $scope.inventario.producto.id)
					.then(function (data) {
						if(!data.hasOwnProperty('id')) { crear();}
						else {
							$scope.error = true;
							$scope.mensajeError = 'El producto selccionado ya esta registrado en el invetario.';
						//editar(data);
						}
							
					});				
			}

			function crear () {
				inventarioService.crear($scope.inventario)
					.then(function () {
						$location.path('/inventarios');
					});
			}

			function editar (inventario) {				
				inventarioService.editar(inventario, $scope.inventario)
					.then(function () {
						$location.path('/inventarios');
					});
			}
		}])
		.controller('ModalInventarioController', ['$scope', '$modalInstance', 'inventarioService', 'data',function ($scope, $modalInstance, inventarioService, data) {			
			var dataList = {};
			var asociacion = data;
			$scope.inventarios = [];					
			$scope.error = false;
			$scope.mensajeError = '';	
			$scope.selected = -1;		

			inventarioService.getTodos(asociacion)
				.then(function (data) {
					dataList = data;
					$scope.inventarios = data;					
				});					

			var contains = function (str, searchString) {
				return str.toLowerCase().indexOf(searchString.toLowerCase()) > -1;
			};

			var startsWith = function (str, searchString) {
				return str.toLowerCase().indexOf(searchString.toLowerCase()) === 0;
			};		

			var filter = function (){
				$scope.inventarios = [];
				$scope.inventarios = dataList.filter(function (obj) {
					if(contains(obj.producto.nombre, $scope.keyword) || contains(obj.producto.compuesto, $scope.keyword) 
						|| contains(obj.producto.presentacion, $scope.keyword)) {
						return obj.producto;
					}
				});
			}			

			$scope.filtrarProductos = function (event) {						
				if(!event){
					filter();							
				}else if(event.keyCode === 13){
					filter();
				}						
			};

			$scope.seleccionar = function ($index) {
				$scope.selected = $index;
			}

			$scope.ok = function () {				
				if($scope.selected === -1){
					$scope.error = true;
					$scope.mensajeError = 'No ha seleccionado ningun item.';
					return;
				}
				$modalInstance.close($scope.inventarios[$scope.selected]);
			}

			$scope.cancelar = function () {			
				$modalInstance.dismiss('cancel');
			}		
		}])
		.controller('ModalCaducidadController', ['$scope', '$modalInstance', 'data', function ($scope, $modalInstance, data) {			
			$scope.caducidad = {};
			$scope.caducidades = data.caducidades;			
			$scope.error = false;			
			var fechas = data.fechas;			
			
			$scope.agregarCaducidad = function () {				
				$scope.error = false;

				if(!$scope.caducidad.cantidad) $scope.error = true;
				if(parseFloat($scope.caducidad.cantidad) <= 0) $scope.error = true;
				if(!$scope.caducidad.fecha) $scope.error = true;				

				if($scope.error) {					
					$scope.mensajeError = 'Los campos de CANTIDAD y FECHA son requeridos.';	
					return;
				}

				if(fechas) {
					for(var i = 0; i < fechas.length; i++) {					
						var fecha = new Date(fechas[i].fecha);
						fecha.setDate(fechas[i].fecha.split('-')[2]);

						if($scope.caducidad.fecha.getDate() != fecha.getDate()) $scope.error = true;
						if($scope.caducidad.fecha.getMonth() != fecha.getMonth()) $scope.error = true;
						if($scope.caducidad.fecha.getFullYear() != fecha.getFullYear()) $scope.error = true;

						if($scope.error){
							$scope.mensajeError = 'No existe items en el inventario con la fecha de caducidad ingresada';
							return;
						}
					}					
				}
							
				$scope.caducidades.push($scope.caducidad);
				$scope.caducidad = {};
			}

			$scope.removerCaducidad = function ($index) {
				$scope.caducidades.splice($index, 1);
			}			

			$scope.ok = function () {
				if($scope.caducidades.length < 1) {
					$scope.error = true;
					$scope.mensajeError = 'No ha ingresado items de caducidad.';
					return;
				}

				$modalInstance.close($scope.caducidades);
			}	

			$scope.cancelar = function () {			
				$modalInstance.dismiss('cancel');
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