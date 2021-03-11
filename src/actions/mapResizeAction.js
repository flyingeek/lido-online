export default function mapResizeAction(node, map) {
    let currentMap = map;
    const resizeMap = () => currentMap && currentMap.resize() /* && console.log('map resized') */;
    const observer = new IntersectionObserver((entries, observer) => { 
        entries.forEach(entry => {
        if(entry.intersectionRatio===1){
            resizeMap();
        }
    });
    }, {threshold: 1});
    observer.observe(node);
    const handleVisibilityChange = () =>{
        if (document && document.visibilityState && document.visibilityState === 'visible') {
            resizeMap();
        }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange, false);
    window.addEventListener("orientationchange", resizeMap);

    return {
        update(map) {
            currentMap = map;
        },
        destroy() {
            observer.unobserve(node);
            observer.disconnect();
            window.removeEventListener("orientationchange", resizeMap);
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            if (currentMap) currentMap.remove();
            //console.log('map removed');
        }
    }
}