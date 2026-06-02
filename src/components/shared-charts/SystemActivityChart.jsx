import dynamic from 'next/dynamic';
const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

/**
 * Gráfico de Atividade do Sistema (adaptado de AudienceReviewChart)
 * Mostra métricas de uso do sistema ao longo do tempo
 */
const SystemActivityChart = () => {
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
        colors: ['#007D88', '#25cba1', '#ebf3fe'],
        fill: {
            opacity: 1
        },
        dataLabels: {
            enabled: false,
        }
    };

    const series = [{
        name: 'Marketing',
        data: [44, 55, 41, 67, 52, 43, 44, 55, 41, 67, 52, 43]
    }, {
        name: 'Citizen',
        data: [13, 23, 20, 18, 13, 27, 13, 23, 20, 18, 13, 27]
    }, {
        name: 'Admin',
        data: [11, 17, 15, 15, 21, 14, 11, 17, 15, 15, 21, 14]
    }];

    return <ReactApexChart options={options} series={series} type="bar" height={270} width="100%" />
}

export default SystemActivityChart
