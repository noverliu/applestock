import fetch from 'node-fetch'



const appleUrl='https://www.apple.com.cn/shop/fulfillment-messages?pl=true&parts.0=MLTC3CH/A&location=%E5%A4%A9%E6%B4%A5%20%E5%A4%A9%E6%B4%A5%20%E5%8D%97%E5%BC%80%E5%8C%BA'

const sendUrl=process.env.SENDURL //Wecomchan 推送接口

const sendKey=process.env.SENDKEY

const logUrl=process.env.LOGURL || sendUrl

const logKey=process.env.LOGKEY

const part=process.env.MODEL || 'MLTC3CH/A'

const pushInterval=process.env.PUSHINTERVAL || 1000*60*5

const queryInterval=process.env.INTERVAL || 1000

const to=process.env.TOUSERS

var lastAlert=new Date();

const queryCount={

}

const checkParam=()=>{
    if(!sendUrl){
        console.error('发送接口错误');
        return false;
    }
    if(!logUrl){
        console.error('日志接口错误');
        return false;
    }
    if(isNaN(pushInterval)){
        console.error('通知间隔无效，默认5分钟');
        logInterval=1000*60*5;
    }
    if(isNaN(queryInterval)||queryInterval<500){
        console.error('查询间隔无效，默认1秒');
        queryInterval=1000;
    }
    return true;
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
            if(availableStores.length>0&&s.partsAvailability[part].pickupMessage){
                let msg=availableStores.map(s=>`${s.storeName}:${s.partsAvailability[part].pickupMessage}`).join('\n');
                console.log(`发现库存`,msg);
                if(new Date()-lastAlert>pushInterval){
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

        logMessage('程序运行中，检测数据如下',msg.join('\n'));
        for(let s in queryCount){
            queryCount[s]=0;
        }
    }
    console.log('Running');
}

const pushMessage=async (title,msg,url,key)=>{
    try {
        const res = await fetch(`${url}`, {
            method: 'POST',
            body: JSON.stringify({
                sendkey: key,
                msg_type: 'text',
                msg: `${title}\n${msg || ''}`,
                to_user: to
            })
        })
        const data = await res.json()
        return console.log(data)
    } catch (err) {
        return console.log(`send error: ${err}`)
    }
}

const sendMessage=(title,msg)=>pushMessage(title,msg,sendUrl,sendKey)

const logMessage=(title,msg)=>pushMessage(title,msg,logUrl,logKey)

const main=()=>{
    if(!checkParam()){
        return;
    };
    logMessage('程序启动','开始检测库存...');
    sendMessage('程序启动','推送接口测试');
    query();
    setInterval(query,queryInterval)
    setInterval(heartbeat,5*60*1000)
}

main();
