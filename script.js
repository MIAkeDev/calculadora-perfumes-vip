// Configuración interna
const TASA_DOLAR = 3.50;
const RECARGO_FIJO = 6.25;
const MAX_PERFUMES = 30;

// Estado de la aplicación
let listaPerfumes = [];
let precioCalculadoActual = 0;

// Referencias del DOM
const inputNombre = document.getElementById('nombre');
const inputPrecioUsd = document.getElementById('precioUsd');
const inputCantidad = document.getElementById('cantidad');
const previewDiv = document.getElementById('previewResult');
const txtResultadoUnitario = document.getElementById('resultadoUnitario');
const contenedorLista = document.getElementById('listaPerfumes');
const txtTotal = document.getElementById('montoTotal');
const txtContador = document.getElementById('contadorItems');

// 1. Función para Calcular (Muestra el botón de agregar)
function calcular() {
    const dolares = parseFloat(inputPrecioUsd.value);
    
    if (isNaN(dolares) || dolares <= 0) {
        alert("Por favor, ingresa un precio en dólares válido.");
        return;
    }

    if (listaPerfumes.length >= MAX_PERFUMES) {
        alert(`Has alcanzado el límite máximo de ${MAX_PERFUMES} perfumes.`);
        return;
    }

    // Fórmula: (USD * 3.50) + 6.25
    precioCalculadoActual = (dolares + RECARGO_FIJO) * TASA_DOLAR  ;
    
    // Mostrar el resultado y el botón agregar
    txtResultadoUnitario.innerText = `S/ ${precioCalculadoActual.toFixed(2)}`;
    previewDiv.classList.remove('preview-hidden');
    previewDiv.classList.add('preview-visible');
}

// 2. Función para Agregar a la lista
function agregar() {
    let nombre = inputNombre.value.trim();
    let cantidad = parseInt(inputCantidad.value);

    // Valores por defecto si están vacíos
    if (!nombre) {
        nombre = `Perfume ${listaPerfumes.length + 1}`;
    }
    if (isNaN(cantidad) || cantidad <= 0) {
        cantidad = 1;
    }

    // Crear el objeto perfume
    const nuevoPerfume = {
        id: Date.now(), // ID único para poder eliminar
        nombre: nombre,
        precioSoles: precioCalculadoActual,
        cantidad: cantidad
    };

    listaPerfumes.push(nuevoPerfume);

    // Resetear la interfaz
    inputNombre.value = '';
    inputPrecioUsd.value = '';
    inputCantidad.value = '';
    previewDiv.classList.remove('preview-visible');
    previewDiv.classList.add('preview-hidden');
    inputNombre.focus();

    actualizarInterfaz();
}

// 3. Función para Eliminar un ítem
function eliminar(id) {
    listaPerfumes = listaPerfumes.filter(perfume => perfume.id !== id);
    actualizarInterfaz();
}

// 4. Actualizar toda la interfaz (Lista y Total)
function actualizarInterfaz() {
    contenedorLista.innerHTML = ''; // Limpiar lista
    let sumaTotal = 0;
    let totalItems = 0;

    listaPerfumes.forEach((perfume) => {
        // Calcular subtotal por ítem
        const subtotal = perfume.precioSoles * perfume.cantidad;
        sumaTotal += subtotal;
        totalItems += perfume.cantidad;

        // Crear la tarjeta visual del ítem
        const divCard = document.createElement('div');
        divCard.className = 'item-card';
        divCard.innerHTML = `
            <div class="item-info">
                <span class="item-name">${perfume.nombre}</span>
                <span class="item-details">${perfume.cantidad} x S/ ${perfume.precioSoles.toFixed(2)} = <b>S/ ${subtotal.toFixed(2)}</b></span>
            </div>
            <button class="btn-delete" onclick="eliminar(${perfume.id})">✕</button>
        `;
        contenedorLista.appendChild(divCard);
    });

    // Actualizar contadores y sumas
    txtTotal.innerText = `S/ ${sumaTotal.toFixed(2)}`;
    txtContador.innerText = listaPerfumes.length; // Cuenta registros distintos
}

// Función para generar el documento PDF
function generarPDF() {
    if (listaPerfumes.length === 0) {
        alert("La lista está vacía. Agrega al menos un perfume.");
        return;
    }

    const numeroCotizacion = document.getElementById('numCotizacion').value || "S/N";
    
    // Obtener la fecha actual en formato DD/MM/YYYY
    const hoy = new Date();
    const dia = String(hoy.getDate()).padStart(2, '0');
    const mes = String(hoy.getMonth() + 1).padStart(2, '0');
    const anio = hoy.getFullYear();
    const fechaActual = `${dia}/${mes}/${anio}`;

    // Inicializar jsPDF
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // --- DISEÑO DEL ENCABEZADO ---
    
    // Simulación del Logo Leiar (Cuadro negro con texto blanco)
    doc.setFillColor(0, 0, 0); // Color negro
    doc.rect(14, 15, 28, 14, 'F'); // Dibujar rectángulo relleno
    doc.setTextColor(255, 255, 255); // Texto blanco
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Leiar", 18, 24); // Texto del logo

    // Datos de la empresa
    doc.setTextColor(0, 0, 0); // Texto negro de nuevo
    doc.setFontSize(10);
    doc.text("Leiar Perfumes", 48, 20);
    doc.setFont("helvetica", "normal");
    doc.text("931 637 965", 48, 25);

    // Título de Cotización
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("COTIZACIÓN", 150, 22);

    // Datos de Fecha y Número
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Fecha:", 15, 45);
    doc.text("Nº de cotización:", 15, 52);
    
    doc.setFont("helvetica", "normal");
    doc.text(fechaActual, 45, 45);
    doc.text(numeroCotizacion, 45, 52);

    // Facturar a (Espacio en blanco como en la imagen)
    doc.text("Facturar :", 15, 75);

    // --- DISEÑO DE LA TABLA ---
    
    // Preparar los datos para la tabla
    const tableData = listaPerfumes.map(perfume => [
        perfume.cantidad,
        perfume.nombre,
        perfume.precioSoles.toFixed(2),
        (perfume.cantidad * perfume.precioSoles).toFixed(2)
    ]);

    // Calcular el total general para imprimirlo al final
    const sumaTotal = listaPerfumes.reduce((acc, curr) => acc + (curr.cantidad * curr.precioSoles), 0);

    // Configuración y dibujo de la tabla usando AutoTable
    doc.autoTable({
        startY: 95, // Empezar debajo del encabezado
        head: [['Cant', 'Descripción', 'Precio Unitario', 'Total']],
        body: tableData,
        theme: 'plain',
        headStyles: {
            fillColor: [51, 51, 51], // Fondo gris oscuro/negro como en tu imagen
            textColor: [255, 255, 255], // Letras blancas
            fontStyle: 'bold',
            halign: 'center'
        },
        columnStyles: {
            0: { halign: 'center', cellWidth: 20 }, // Cant
            1: { halign: 'left', cellWidth: 100 }, // Descripción
            2: { halign: 'right', cellWidth: 35 }, // Precio Unitario
            3: { halign: 'right', cellWidth: 35 }  // Total
        },
        bodyStyles: {
            textColor: [0, 0, 0]
        }
    });

    // --- DISEÑO DEL PIE DE PÁGINA ---
    
    // Obtener la posición "Y" donde terminó la tabla
    let finalY = doc.lastAutoTable.finalY + 15;

    // Imprimir los totales alineados a la derecha
    doc.setFont("helvetica", "bold");
    doc.text("Total", 140, finalY);
    doc.text(sumaTotal.toFixed(2), 180, finalY, { align: "right" });

    // Mensaje de agradecimiento al fondo de la hoja
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text("Gracias por su preferencia.", 15, 280);

    // Nombre del archivo dinámico
    const nombreArchivo = numeroCotizacion !== "S/N" 
        ? `Cotizacion_Leiar_${numeroCotizacion}.pdf` 
        : `Cotizacion_Leiar.pdf`;

    // Descargar el archivo
    doc.save(nombreArchivo);
}