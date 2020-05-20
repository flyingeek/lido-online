export default function (urls, test, callback) {
    let remaining = urls.length
  
    function maybeCallback () {
      remaining = --remaining
      if (remaining < 1) {
        callback()
      }
    }
  
    if (!test()) {
      urls.forEach(({ type, url, options = { async: true, defer: true }}) => {
        const isScript = type === 'script'
        const tag = document.createElement(isScript ? 'script': 'link')
        let onload = true
        if (isScript) {
          tag.src = url
          tag.async = options.async
          tag.defer = options.defer
        } else {
            tag.href = url
            if ('prefetch' in options){
                tag.rel = "prefetch"
                remaining -= 1
                onload = false
            } else if ('preload' in options) {
                tag.rel = 'preload'
                remaining -= 1
                onload = false
            } else {
                tag.rel = 'stylesheet'
            }
        }
        if (onload) tag.onload = maybeCallback
        document.body.appendChild(tag)
      })
    } else {
      callback()
    }
  }