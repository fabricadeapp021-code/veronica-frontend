import dynamic from 'next/dynamic';
const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

/**
 * Gráfico de Receitas vs Despesas (adaptado de ReturningCustomerChart)
 * Mostra distribuição percentual entre receitas e despesas
 */
const RevenueExpenseChart = ({ revenue = 850000, expense = 620000 }) => {
    const total = revenue + expense;
    const revenuePercent = Math.round((revenue / total) * 100);
    const expensePercent = Math.round((expense / total) * 100);

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
                            const balance = revenue - expense;
                            return new Intl.NumberFormat('pt-BR', {
                                style: 'currency',
                                currency: 'BRL',
                                minimumFractionDigits: 0
                            }).format(balance);
                        }
                    }
                }
            }
        },
        colors: ['#00CC66', '#FF3366'],
        labels: ['Receitas', 'Despesas'],
    };

    const series = [revenuePercent, expensePercent];

    return <ReactApexChart options={options} series={series} type="radialBar" height={235} width="100%" />
}

export default RevenueExpenseChart
