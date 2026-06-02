import dynamic from 'next/dynamic';
const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

/**
 * Gráfico de Desempenho de Campanhas (adaptado de AudienceReviewChart)
 * Mostra métricas de campanhas ao longo do tempo
 */
const CampaignPerformanceChart = () => {
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
        colors: ['#0066FF', '#00CC66', '#FF9900'],
        fill: {
            opacity: 1
        },
        dataLabels: {
            enabled: false,
        }
    };

    const series = [{
        name: 'Facebook Ads',
        data: [320, 450, 380, 520, 410, 480, 420, 500, 380, 560, 490, 520]
    }, {
        name: 'Google Ads',
        data: [180, 280, 240, 200, 190, 310, 180, 280, 240, 200, 190, 310]
    }, {
        name: 'Instagram',
        data: [140, 220, 190, 180, 260, 170, 140, 220, 190, 180, 260, 170]
    }];

    return <ReactApexChart options={options} series={series} type="bar" height={270} width="100%" />
}

export default CampaignPerformanceChart
