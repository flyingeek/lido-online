export default function mapResizeAction(node, map) {
    let currentMap = map;
    const resizeMap = () => {
        if (currentMap && document && document.visibilityState && document.visibilityState === 'visible') {
            currentMap.resize();
            //console.log('map resized');
        }
    };
    const observer = new IntersectionObserver((entries) => { 
        entries.forEach(entry => {
        if(entry.intersectionRatio===1){
            resizeMap();
        }
    });
    }, {threshold: 1});
    observer.observe(node);
    document.addEventListener("visibilitychange", resizeMap, false);
    window.addEventListener("orientationchange", resizeMap);

    return {
        update(map) {
            currentMap = map;
        },
        destroy() {
            observer.unobserve(node);
            observer.disconnect();
            window.removeEventListener("orientationchange", resizeMap);
            document.removeEventListener("visibilitychange", resizeMap);
            if (currentMap) currentMap.remove();
            //console.log('map removed');
        }
    }
}