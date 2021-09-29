import fetch from 'node-fetch'

const appleUrl='https://www.apple.com.cn/shop/fulfillment-messages?pl=true&parts.0=MLTC3CH/A&location=%E5%A4%A9%E6%B4%A5%20%E5%A4%A9%E6%B4%A5%20%E5%8D%97%E5%BC%80%E5%8C%BA'

const sendUrl=`https://XXX` //Wecomchan 推送接口

const part='MLTC3CH/A'

const interval=1000*60*3

var lastAlert=new Date();

const queryCount={

}

const query=()=>{
    fetch(appleUrl)
    .then(res=>res.json())
    .then(data=>{
        let stores=data.body.content.pickupMessage.stores
        if(Array.isArray(stores)){
            // console.log(`查询时间：${Date()}`)
            let availableStores=stores.filter(s=>{
                if(s.city!='天津'){
                    return false;
                }
                let stock=s.partsAvailability[part]
                if(stock.pickupDisplay=='unavailable'){
                    let sto=queryCount[s.storeName]||{}
                    let cnt=sto[stock.pickupSearchQuote];

                    sto[stock.pickupSearchQuote]=isNaN(cnt)?1:cnt+1;
                    queryCount[s.storeName]=sto;
                    return false;
                }
                console.log(`${s.storeName}-${stock.pickupSearchQuote}`);
                
                return true;
            })
            if(availableStores.length>0){
                let msg=availableStores.map(s=>`${s.storeName}:${s.partsAvailability[part].pickupMessage}`).join('\n');
                console.log(`发现库存`,msg);
                if(new Date()-lastAlert>interval){
                    sendMessage('iPhone 13 Pro 到货啦！',)
                    lastAlert=new Date();
                }
            }
        }
    })
    .catch(err=>console.error(err));
}



const heartbeat=()=>{
    var now=new Date();
    if(now.getMinutes()%30<5){
        let msg=[];
        for(let i in queryCount){
            let data=Object.entries(queryCount[i]).map(x=>`${x.join(':')}次`).join('\n');
            msg.push(i,data);
        }

        sendMessage('程序运行中，检测数据如下',msg.join('\n'));
        for(let s in queryCount){
            queryCount[s]=0;
        }
    }
    console.log('Running');
}

const sendMessage=(title,msg)=>{
    fetch(`${sendUrl}`,{
        method:'POST',
        body:JSON.stringify({
            sendkey:'XXXXXX',
            msg_type:'text',            
            msg:`${title}\n${msg||''}`,
            to_user:''
        })
    }).then(res=>res.json())
    .then(data=>console.log(data))
    .catch(err=>console.log(`send error: ${err}`))
}

sendMessage('程序启动','开始检测库存...');
query();
setInterval(query,0.5*1000)
setInterval(heartbeat,5*60*1000)
