import {writable} from 'svelte/store';
import {showGramet} from '../stores';

export const grametStatus = writable();
export const grametResponseStatus = writable({});
const grametMargin = 65; // left and right margin to the "inner gramet" image in px
const grametTop = 33;// top margin to the "inner gramet" image in px

export function grametThumbAction(container, {ofp, pos, fl}){
    const plane = document.getElementById('gt-plane');
    let objectURL;
    let position = parseFloat(pos);
    let currentOfp = ofp;
    let img;
    let clone;
    let iWidth; // the image width (small size computed by browser)
    let scale;
    let level = fl;
    const viewportHeight = container.clientHeight;
    const viewportWidth = container.clientWidth;
    const style = getComputedStyle(document.body);
    const gInnerHeight = parseFloat(style.getPropertyValue('--gramet-inner-height', "384px").slice(0, -2)); //remove px
    const position2pixel = (position) =>  {
        return ((grametMargin * scale) + ((iWidth - (grametMargin * 2 * scale)) * position / 100));
    }
    const imageOffsetForPosition = (position) => {
        const pixelPosX = position2pixel(position);
        const margin = grametMargin * scale; // in the thubnail we hide the left and right margin
        const iw = iWidth;
        const lock = viewportWidth /3; // plane locked position when we scroll image
        const min = margin + lock;
        const max = (iw - margin) - (viewportWidth - lock)
        if (pixelPosX > (min) && pixelPosX < max){
            return lock - pixelPosX;
        }else if(pixelPosX <= min){
            return lock - min;
        }else{
            return lock -max;
        }
    }
    const placePlane = (plane, planePosition, x, planeLevel) => {
        if(plane){
            plane.style.left = (x + (position2pixel(planePosition) - (plane.clientWidth / 2))) + 'px';
            plane.style.top = (((gInnerHeight - Math.round((-0.0006 * planeLevel * planeLevel) + (0.8985 * planeLevel) + 46.264)) * scale) - (plane.clientHeight / 2)) + 'px';
        }
    }
    const loadListener = () => {
        const gHeight = img.height || 700;
        clone = img.cloneNode();
        clone.id = "grametImg";
        clone.style.display = 'none';
        clone.crossOrigin = "anonymous"; // otherwise sw does not cache
        clone.addEventListener('load', cloneLoadListener); // Safari required the clone to be loaded before adding it to pinchzoom
        clone.addEventListener('error', errorListener);
        document.body.appendChild(clone);
        img.style.height = `${(gHeight/gInnerHeight) * viewportHeight}px`; // 700 is the full gramet height, 380 is the real gramet height
        img.style.objectFit = 'contain';
        img.style.position =  'absolute';
        img.style.opacity = 0.01;
        container.appendChild(img);
        iWidth= img.clientWidth;
        const h = img.clientHeight;
        const ratio = h / gHeight;
        scale = ratio;
        const offset = imageOffsetForPosition(position);
        img.style.top = `-${grametTop * ratio}px`;
        img.style.left = `${offset}px`;
    };
    const cloneLoadListener = () => {
        grametStatus.set('success');
        plane.style.display = 'block';
        img.style.opacity = 1;
        const offset = imageOffsetForPosition(position);
        placePlane(plane, position, offset, level);
    };
    const errorListener = () => {
        plane.style.display = 'none';
        grametStatus.set('error');
    };
    const cleanup = () => {
        if (img) img.removeEventListener('load', loadListener);
        if (img) img.removeEventListener('error', errorListener);
        if (img) img.remove();
        showGramet.set(false);
        if (clone) clone.removeEventListener('load', cloneLoadListener);
        if (clone) clone.removeEventListener('error', errorListener);
        if (clone) clone.remove();
        clone = undefined;
        img = undefined;
        if(objectURL) URL.revokeObjectURL(objectURL);
        objectURL = undefined;
    }
    const createImg = async (ofp) => {
        img = document.createElement('img')
        grametStatus.set('loading');
        plane.style.display = 'none';
        fetch(ofp.ogimetData.proxyImg).then(function(response) {
            if(response.ok) {
                grametResponseStatus.set({status: response.status, text: response.statusText || 'OK'});
                response.blob().then((blob) => {
                    if (img) { // img could be empty if grametTrigger was destroyed before receiving Gramet (page change)
                        objectURL = URL.createObjectURL(blob);
                        img.addEventListener('load', loadListener);
                        img.addEventListener('error', errorListener);
                        img.src = objectURL;
                    }
                });
            } else {
                errorListener();
                if (response.headers) {
                    grametResponseStatus.set({status: response.status, text:response.statusText ||response.headers.get('X-ofp2map-status')})
                } else {
                    grametResponseStatus.set({status: response.status, text:response.statusText || ""})
                }
            }
        })
        .catch(function(error) {
                errorListener();
                console.log('catch', error);
                grametResponseStatus.set({status: 0, text: error.message});
        });
    };
    createImg(ofp);

    return {
        update({ofp, pos, fl}){
            position = parseFloat(pos);
            if (ofp !== currentOfp) {
                currentOfp = ofp;
                cleanup();
                createImg(ofp);
            }else{
                const offset = imageOffsetForPosition(position);
                img.style.left = offset  + 'px';
                level = fl;
                placePlane(plane, position, offset, fl);
            }
        },
        destroy(){
            cleanup();
        }
    }
}


//To load Gramet Img im pinchzoom
//due to problem with Safari, we keep a clone in the document
//that way there is less reload and incomplete image appearing in the pinchzoom view
export const setGramet = (pinchZoom, {pos, fl}) => {
    const plane = pinchZoom.parentNode.querySelector('svg');
    const img = document.getElementById('grametImg');
    const style = getComputedStyle(document.body);
    const gInnerHeight = parseFloat(style.getPropertyValue('--gramet-inner-height', "384px").slice(0, -2)); //remove px
    const maxHeight = parseFloat(pinchZoom.parentNode.dataset.maxHeight || "370");
    const iWidth = img.width;
    const iHeight = img.height;
    const nav = document.querySelector('nav');
    const viewportWidth = nav.clientWidth;
    let cHeight;
    if (iWidth !== 0){
        cHeight = Math.min((viewportWidth / iWidth) * iHeight, maxHeight);
    } else {
        cHeight = Math.min(iHeight, maxHeight);
    }
    let position = parseFloat(pos);
    let scale;
    let x = 0;
    let y = 0;
    let allowImgScroll;
    let level = fl;
    const position2pixel = (position) =>  {
        return (grametMargin + ((iWidth - (grametMargin * 2)) * position / 100)) * scale;
    }
    const placePlane = (plane, planePosition, planeLevel) => {
        // before and after flight, displays the full gramet
        plane.style.left = (x + (position2pixel(planePosition) - (plane.clientWidth/2) + 2)) + 'px';
        plane.style.top = (((gInnerHeight  + grametTop - 2 - Math.round((-0.0006 * planeLevel * planeLevel) + (0.8985 * planeLevel) + 46.264)) * scale) - (plane.clientHeight / 2)) + y + 'px';//TODO
    }
    const imageOffsetForPosition = (position) => {
        const pixelPosX = position2pixel(position);
        const margin = 0; // we do not try to hide the left/right margin in this view
        const lock = viewportWidth /3;
        const min = margin + lock;
        const iw = iWidth * scale; // the scale here is due to pinchzoom
        const max = (iw - margin) - (viewportWidth - lock);
        if (pixelPosX > min && pixelPosX < max){
            return lock - pixelPosX;
        }else if(pixelPosX <= min){
            return lock - min;
        }else{
            return lock - max;
        }
    }
    const pinchzoomChange = () => {
        x = pinchZoom.x; // x offset
        y = pinchZoom.y; // y offset
        scale = pinchZoom.scale; // scale
        allowImgScroll = (viewportWidth <= iWidth * scale);
        placePlane(plane, position, level);
    }
    
    if (position <= 0 || position >= 100) {
        // flight is not yet progress or finished
        if (iWidth === 0){
            scale = maxHeight / (gInnerHeight + 70);
        } else {
            scale = Math.min(viewportWidth/iWidth, cHeight / (gInnerHeight + 70));
        }
        y = 0;
    } else {
        // flight is in progress
        scale = cHeight / (gInnerHeight);
        y = - grametTop * scale;
    }
    if (viewportWidth > iWidth * scale) {
        x = (viewportWidth - (iWidth * scale)) / 2;
        allowImgScroll = false;
    } else {
        x = imageOffsetForPosition(position);
        allowImgScroll = true;
    }
    placePlane(plane, position, level);
    img.style.display = "block";
    pinchZoom.style.maxHeight = `${maxHeight}px`;
    pinchZoom.appendChild(img);
    pinchZoom.setTransform({scale, x, y});
    pinchZoom.addEventListener("change", pinchzoomChange);
    return {
        update({pos, fl}){
            position = parseFloat(pos);
            level = fl;
            if (allowImgScroll) {
                x = imageOffsetForPosition(position);
                pinchZoom.setTransform({x});
            }
            placePlane(plane, position, fl);
        },
        destroy(){
            img.style.display = 'none';
            document.body.appendChild(img);
            pinchZoom.removeEventListener("change", pinchzoomChange);
        }
    }
};

//To set the pinchzoom drawer height
// adjust the size of the parent (the larger the gramet, the less height)
export const setHeight = (container) => {
    const img = document.getElementById('grametImg');
    const gWidth = img.width;
    const gHeight = img.height || 700;
    const maxHeight = parseFloat(container.dataset.maxHeight || "370");
    const nav = document.querySelector('nav');
    const nWidth = nav.clientWidth;
    let ratio = 1;
    if (gWidth !== 0){
        ratio = nWidth / gWidth;
    }
    const height = Math.min(ratio * gHeight, maxHeight);
    container.style.height = `${height}px`;
}
