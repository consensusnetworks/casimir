module.exports = {
    content: [
        "./**/*.{vue,ts,js,css}"
    ],
    theme: {
        extend: {
            padding: {
                "margins": "48px",
                "y-spacer": "25px"
            },
            colors: {
                // Main Colors
                "primary": "#0D5FFF",
                "black": "#000",
                "secondary": "#C1D3F8",
                "white": "#fff",
                "shade": "#615959",
                "grey": "#727476",

                // Blues
                "blue_1": "#E5EEFF",
                "blue_2": "#C1D3F8",
                "blue_3": "#80ABFF",
                "blue_4": "#4D89FF",
                "blue_5": "#0D5FFF",
                "blue_6": "#004EE6",
                "blue_7": "#003CB3",
                "blue_8": "#002B80",
                "blue_9": "#001A4D",
                "blue_10": "#00091A",

                // Greys Shades
                "grey_1": "#F2F2F2",
                "grey_2": "#D9D9D9",
                "grey_3": "#BFBFBF",
                "grey_4": "#A6A6A6",
                "grey_5": "#8C8C8C",
                "grey_6": "#737373",
                "grey_7": "#595959",
                "grey_8": "#404040",
                "grey_9": "#262626",
                "grey_10": "#000000",

                // Functional Colors
                "warning": "#FBBD84",
                "approve": "#7BE198",
                "decline": "#FF8080",
                "border": "#B2BACB",
            },
            spacing: {
                "gutter": "16px",
                "navbar": "300px",
                "margins": "48px",
                "marginsX": "48px",
                "marginsY": "24px",

                "1": "1px",
                "2": "2px",
                "3": "3px",
                "4": "4px",
                "5": "5px",
                "6": "6px",
                "7": "7px",
                "8": "8px",
                "9": "9px",
                "10": "10px",
                "11": "11px",
                "12": "12px",
                "15": "15px",
                "16": "16px",
                "20": "20px",
                "22": "22px",
                "25": "25px",
                "30": "30px",
                "35": "35px",
                "40": "40px",
                "45": "45px",
                "50": "50px",
                "70": "70px",
                "75": "75px",
                "100": "100px",
                // if change, change anim in index.css
                "sidebar-open": "300px",
                "sidebar-closed": "75px"
            }
        },
        fontFamily: {
            "regular": "OpenSauceOneRegular",
            "medium": "OpenSauceOneMedium",
            "semibold": "OpenSauceOneSemibold",
            "bold": "OpenSauceOneBold",
            "extrabold": "OpenSauceOneExtrabold",
            "black": "OpenSauceOneBlack",
            "light": "OpenSauceOneLight",
        },
        screens: {
            "360s": { "min": "0px", "max": "360px" },
            "400s": { "min": "0px", "max": "400px" },
            "450s": { "min": "0px", "max": "450px" },
            "550s": { "min": "0px", "max": "550px" },
            "600s": { "min": "0px", "max": "600px" },
            "700s": { "min": "0px", "max": "700px" },
            "800s": { "min": "0px", "max": "800px" },
            "900s": { "min": "0px", "max": "900px" },
            "1000s": { "min": "0px", "max": "1000px" },
            "1100s": { "min": "0px", "max": "1100px" },
            "1200s": { "min": "0px", "max": "1200px" },
            // no screen 
            // 'noscreen': {'min': '360px'},
            // 'xsm': {'min': '0px', 'max': '359px'},
            // 'sm': {'min': '360px', 'max': '719px'},
            // 'md': {'min': '720px', 'max': '1023px'},
            // 'lg': {'min': '1024px'},

            // Combine smalls
            // 'csm': {'min': '0px', 'max': '719px'},

            // Combine smalls & medium
            // 'csm-md': {'min': '0px', 'max': '1023px'},

            // nav-bar text-container
            // 'nav-mid': {'min': '720px', 'max': '1100px'},
            // 'nav-sm': {'min': '500px', 'max': '719px'},
            // 'nav-xsm': {'min': '0px', 'max': '499px'},

            // breakpoints for staking page
            // 's_lg' : {'min':'1100px'},
            // 's_md' : {'min':'900px'},
            // 's_sm' : {'min':'700px'},
            // 's_xsm' : {'min':'550px'},

            // dashboard breakpoints
            // 'dash_s_sm' : {'min':'750px'},
            // 'dash_mid': {'min': '700px', 'max': '750px'},
        },
    },
    plugins: []
}