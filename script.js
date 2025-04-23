
let saldoActual = 0;
let montoInicial = 0;
const gastosPorCategoria = {};
const gastosTotales = [];

const colores = {
  Comida: '#e53935',
  Transporte: '#1e88e5',
  Ocio: '#fdd835',
  Educación: '#43a047',
  Servicios: '#8e24aa',
  Salud: '#fb8c00',
  Ropa: '#3949ab',
  Otros: '#6d4c41',
  Disponible: '#00acc1'
};

const pieChartCtx = document.getElementById('pieChart').getContext('2d');
const pieChart = new Chart(pieChartCtx, {
  type: 'pie',
  data: {
    labels: [],
    datasets: [{
      data: [],
      backgroundColor: []
    }]
  },
  options: {
    responsive: true,
    plugins: {
      legend: { position: 'bottom' },
      datalabels: {
        formatter: (value, ctx) => {
          let sum = ctx.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
          let percentage = sum ? (value * 100 / sum).toFixed(1) + '%' : '0%';
          return percentage;
        },
        color: '#fff',
        font: {
          weight: 'bold',
          size: 14
        }
      }
    }
  },
  plugins: [ChartDataLabels]
});

function actualizarGrafico() {
  const labels = ['Disponible', ...Object.keys(gastosPorCategoria)];
  const data = [saldoActual, ...Object.values(gastosPorCategoria)];
  const backgroundColors = [colores.Disponible, ...Object.keys(gastosPorCategoria).map(cat => colores[cat] || '#ccc')];

  pieChart.data.labels = labels;
  pieChart.data.datasets[0].data = data;
  pieChart.data.datasets[0].backgroundColor = backgroundColors;
  pieChart.update();
}

function establecerMontoInicial() {
  const input = parseFloat(document.getElementById('initial-amount').value);
  if (!isNaN(input) && input > 0) {
    montoInicial = input;
    saldoActual = input;
    for (let cat in gastosPorCategoria) delete gastosPorCategoria[cat];
    gastosTotales.length = 0;
    actualizarSaldo();
    actualizarGrafico();
    document.getElementById('expenses-ul').innerHTML = '';
    document.getElementById('initial-amount').value = '';
  } else {
    alert("Ingresá un monto válido.");
  }
}

function añadirMonto() {
  const addInput = parseFloat(document.getElementById('add-amount').value);
  if (!isNaN(addInput) && addInput > 0) {
    saldoActual += addInput;
    actualizarSaldo();
    actualizarGrafico();
    document.getElementById('add-amount').value = '';
  } else {
    alert("Ingresá un monto válido para añadir.");
  }
}

function actualizarSaldo() {
  document.getElementById('saldo').innerText = saldoActual.toFixed(2);
}

document.getElementById('expense-form').addEventListener('submit', function(e) {
  e.preventDefault();
  const descripcion = document.getElementById('description').value;
  const monto = parseFloat(document.getElementById('amount').value);
  const categoria = document.getElementById('category').value;
  const fecha = document.getElementById('date').value;

  if (descripcion && !isNaN(monto) && categoria && fecha && monto > 0) {
    if (monto > saldoActual) {
      alert("No tenés saldo suficiente.");
      return;
    }

    saldoActual -= monto;
    gastosPorCategoria[categoria] = (gastosPorCategoria[categoria] || 0) + monto;
    gastosTotales.push({ descripcion, monto, categoria, fecha });
    actualizarSaldo();
    actualizarGrafico();

    const li = document.createElement('li');
    li.innerHTML = `<strong>${descripcion}</strong> - $${monto.toFixed(2)} <em>(${categoria})</em> <small>${fecha}</small>`;
    document.getElementById('expenses-ul').appendChild(li);

    document.getElementById('description').value = '';
    document.getElementById('amount').value = '';
    document.getElementById('category').value = '';
    document.getElementById('date').value = '';
  } else {
    alert("Completá todos los campos correctamente.");
  }
});

function filtrarGastos() {
  const filtro = document.getElementById('filtro').value.toLowerCase();
  const ul = document.getElementById('expenses-ul');
  ul.innerHTML = '';
  gastosTotales.filter(g => g.descripcion.toLowerCase().includes(filtro)).forEach(gasto => {
    const li = document.createElement('li');
    li.innerHTML = `<strong>${gasto.descripcion}</strong> - $${gasto.monto.toFixed(2)} <em>(${gasto.categoria})</em> <small>${gasto.fecha}</small>`;
    ul.appendChild(li);
  });
}

function exportarExcel() {
  // Crear los datos a exportar (con los gastos y los totales)
  const datos = gastosTotales.map(g => ({
    Descripcion: g.descripcion,
    Monto: g.monto,
    Categoria: g.categoria,
    Fecha: g.fecha
  }));

  const totalGastos = gastosTotales.reduce((acc, g) => acc + g.monto, 0);
  const totalIngresos = montoInicial + (saldoActual + totalGastos - montoInicial);

  datos.push(
    {},
    { Descripcion: 'TOTAL GASTOS', Monto: totalGastos },
    { Descripcion: 'TOTAL INGRESOS', Monto: totalIngresos },
    { Descripcion: 'SALDO FINAL', Monto: saldoActual }
  );

  // Crear el encabezado que se va a mostrar en la primera fila
  const encabezado = [
    ["PlataJoven - Controlador de Gastos", "", "", new Date().toLocaleDateString()]
  ];

  // Convertir los datos de JSON a formato de hoja de cálculo
  const ws = XLSX.utils.json_to_sheet(datos, { header: ["Descripcion", "Monto", "Categoria", "Fecha"] });

  // Agregar el encabezado al principio de la hoja de Excel
  XLSX.utils.sheet_add_aoa(ws, encabezado, { origin: "A1" });

  // Crear un libro de trabajo con los datos
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Gastos");

  // Exportar el archivo Excel
  XLSX.writeFile(wb, `Gastos_PlataJoven_${new Date().toLocaleDateString()}.xlsx`);
}
