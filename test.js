let data = Buffer.from('3A026862', 'hex')
console.log(data.toString('utf-8'),createMessageClientHBFirst())
function createMessageClientHBFirst (){
    let header = "320270623a026862420a0"

    // console.log("idHexServer", that.clone.idHexServer)
    let hex = header + that.clone.idHexServer + (that.clone.part ||"68")
    let idHex = Buffer.from(hex, 'hex')
    // console.log("ClientHB", hex,idHex.toString  ("utf8"))
    return idHex
}