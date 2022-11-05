module.exports = {
    content: [
        './**/*.{vue,ts,js,css}'
    ],
    theme: {
        extend: {
            padding: {
                'margins': '48px',
                'y-spacer': '25px'
            },
            colors: {
                // Main Colors
                'primary': '#0D5FFF',
                'black': '#000',
                'secondary': '#C1D3F8',
                'white': '#fff',
                'shade': '#615959',

                // Blues
                'blue_1': '#E5EEFF',
                'blue_2': '#C1D3F8',
                'blue_3': '#80ABFF',
                'blue_4': '#4D89FF',
                'blue_5': '#0D5FFF',
                'blue_6': '#004EE6',
                'blue_7': '#003CB3',
                'blue_8': '#002B80',
                'blue_9': '#001A4D',
                'blue_10': '#00091A',

                // Greys Shades
                'grey_1': '#F2F2F2',
                'grey_2': '#D9D9D9',
                'grey_3': '#BFBFBF',
                'grey_4': '#A6A6A6',
                'grey_5': '#8C8C8C',
                'grey_6': '#737373',
                'grey_7': '#595959',
                'grey_8': '#404040',
                'grey_9': '#262626',
                'grey_10': '#000000',

                // Functional Colors
                'warning': '#FBBD84',
                'approve': '#7BE198',
                'decline': '#FF8080',
                'borders': '#E4E4E7',
            },
            spacing: {
                'gutter': '16px',
                'navbar': '300px',
                'margins': '48px',
                'routerview': `calc(100vh - 300px)`,
            }
        },
        fontFamily: {
            'regular': 'OpenSauceOneRegular',
            'medium': 'OpenSauceOneMedium',
            'semibold': 'OpenSauceOneSemibold',
            'bold': 'OpenSauceOneBold',
            'extrabold': 'OpenSauceOneExtrabold',
            'black': 'OpenSauceOneBlack',
            'light': 'OpenSauceOneLight',
        },
        screens: {
            'xsm': {'min': '0px', 'max': '359px'},
            'sm': {'min': '360px', 'max': '719px'},
            'md': {'min': '720px', 'max': '1023px'},
            'lg': {'min': '1024px'},

            // Combine smalls
            'csm': {'min': '0px', 'max': '719px'},

            // Combine smalls & medium
            'csm-md': {'min': '0px', 'max': '1023px'},

            // nav-bar text-container
            'nav-mid': {'min': '720px', 'max': '1100px'},
            'nav-sm': {'min': '500px', 'max': '719px'},
            'nav-xsm': {'min': '0px', 'max': '499px'}
        },
    },
    plugins: []
}