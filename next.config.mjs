/** @type {import('next').NextConfig} */
const nextConfig = {
    async redirects() {
        return [
            {
                source: '/',
                destination: '/auth/login',
                permanent: false, // evita cache agressivo do browser durante ajustes
            },
        ];
    },
    sassOptions: {
        quietDeps: true, // Suppresses warnings from dependencies
        api: 'modern-compiler',

    },
};

export default nextConfig;