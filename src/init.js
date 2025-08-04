let delay = (time)=> new Promise(r=>setTimeout(r,time))
let init = async function(){
  window.parseQueryString = (queryString)=> {
    const urlSearchParams = new URLSearchParams(queryString);
    const paramsObject = {};
  
    // Lặp qua tất cả các cặp khóa / giá trị trong URLSearchParams và thêm chúng vào đối tượng
    for (const [key, value] of urlSearchParams.entries()) {
      paramsObject[key] = value;
    }
  
    return paramsObject;
  }
  
  if(window.byted_acrawler && window.byted_acrawler.frontierSign){
    window.sign = (args) => {
      let frontierSign = window.byted_acrawler.frontierSign
      let temp = frontierSign['_v'][2]
      frontierSign['_v'] = [413, 2, temp]
      let result = frontierSign(...args)
      return result
    }
    window.buildUrl = ({url, bodyEncoded, bodyJson})=>{
      let [ host, params] = url.split("?")
      if(bodyEncoded && !bodyJson){
        bodyJson = parseQueryString(bodyEncoded)
      }
      let ars = [params] 
      if(bodyEncoded){
        ars.push(bodyEncoded)
      }
      let xbogus = window.sign(ars);
      let new_url =  `${url}&X-Bogus=${xbogus}`;
      let sign_params = { url: new_url}
      if(bodyJson){
        sign_params.bodyVal2str = true;
        sign_params.body = bodyJson;
      }
      let ars_signature = [ sign_params, undefined, "forreal"]
      let _signed = window.getSignature(...ars_signature)
      let result =  { _signature: _signed, url: `${url}&X-Bogus=${xbogus}&_signature=${_signed}`, xbogus, bodyEncoded, bodyJson}
      return result
    }
  } else {
    await delay(200);
    return init()
  }
}
init();