import dynamic from 'next/dynamic';
const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

/**
 * Gráfico de Atendimentos ao Cidadão (adaptado de AudienceReviewChart)
 * Mostra volume de atendimentos por canal
 */
const CitizenServiceChart = () => {
    var options = {
        chart: {
            type: 'bar',
            height: 270,
            width: '100%',
            stacked: true,
            toolbar: {
                show: false
            },
            zoom: {
                enabled: false
            },
            foreColor: "#646A71",
            fontFamily: 'DM Sans',
        },
        grid: {
            borderColor: '#F4F5F6',
        },
        plotOptions: {
            bar: {
                horizontal: false,
                columnWidth: '35%',
                borderRadius: 5,    
                borderRadiusApplication: "end",
                borderRadiusWhenStacked: "last",
            },
        },
        xaxis: {
            type: 'datetime',
            categories: [
                '01/14/2026 GMT',
                '01/15/2026 GMT',
                '01/16/2026 GMT',
                '01/17/2026 GMT',
                '01/18/2026 GMT',
                '01/19/2026 GMT',
                '01/20/2026 GMT',
                '01/21/2026 GMT',
                '01/22/2026 GMT',
                '01/23/2026 GMT',
                '01/24/2026 GMT',
                '01/25/2026 GMT',
            ],
            labels: {
                style: {
                    fontSize: '12px',
                    fontFamily: 'inherit',
                },
            },
            axisBorder: {
                show: false,
            },
            title: {
                style: {
                    fontSize: '12px',
                    fontFamily: 'inherit',
                }
            }
        },
        yaxis: {
            labels: {
                style: {
                    fontSize: '12px',
                    fontFamily: 'inherit',
                },
            },
            title: {
                style: {
                    fontSize: '12px',
                    fontFamily: 'inherit',
                }
            },
        },
        legend: {
            show: true,
            position: 'top',
            fontSize: '15px',
            labels: {
                colors: '#6f6f6f',
            },
            markers: {
                size: 5,
                shape: "circle",
            },
            itemMargin: {
                vertical: 5
            },
        },
        colors: ['#00CC66', '#0066FF', '#FF9900'],
        fill: {
            opacity: 1
        },
        dataLabels: {
            enabled: false,
        }
    };

    const series = [{
        name: 'WhatsApp',
        data: [125, 145, 130, 165, 140, 155, 135, 160, 130, 170, 150, 165]
    }, {
        name: 'Chat Web',
        data: [85, 95, 80, 90, 75, 100, 85, 95, 80, 90, 75, 100]
    }, {
        name: 'Telefone',
        data: [45, 60, 50, 55, 65, 50, 45, 60, 50, 55, 65, 50]
    }];

    return <ReactApexChart options={options} series={series} type="bar" height={270} width="100%" />
}

export default CitizenServiceChart
