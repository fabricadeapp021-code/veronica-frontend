import dynamic from 'next/dynamic';
const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

/**
 * Gráfico de Distribuição de Uso por Módulo (adaptado de ReturningCustomerChart)
 * Mostra distribuição percentual de uso entre módulos
 */
const ModuleDistributionChart = ({ totalValue = '$15.8k' }) => {
    var options = {
        stroke: {
            lineCap: 'round'
        },
        chart: {
            height: 235,
            width: "100%",
            type: 'radialBar',
        },
        plotOptions: {
            radialBar: {
                hollow: {
                    margin: 0,
                    size: "55%",
                },
                dataLabels: {
                    showOn: "always",
                    name: {
                        show: false,
                    },
                    value: {
                        fontSize: "1.75rem",
                        show: true,
                        fontWeight: '500'
                    },
                    total: {
                        show: true,
                        formatter: function () {
                            return totalValue;
                        }
                    }
                }
            }
        },
        colors: ['#007D88', '#25cba1'],
        labels: ['Marketing', 'Citizen'],
    };

    const series = [68, 75];

    return <ReactApexChart options={options} series={series} type="radialBar" height={235} width="100%" />
}

export default ModuleDistributionChart
