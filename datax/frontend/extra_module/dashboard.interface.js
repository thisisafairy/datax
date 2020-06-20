
(function () {
    $.ajax({
        url:'/cost/regenerateData',
        type:'GET',
        success:function (data) {
            console.log('successful ajax')
        }
    });
    "use strict";
    angular.module('dashboardInterface', [])
        .service('filterValueChange', function ($http, $q, $timeout) {
            /**
             * dashboard面板中值改变之后执行的代码
             * dashboardItems: dashboard面板组件对象数组，currentItem执行过滤的过滤器对象
             */
            this.afterChange = function (dashboardItems, currentItem) {
                var itemType = currentItem.data.dropType ? currentItem.data.dropType : currentItem.data.datatype;
                console.log('dashboardItems', dashboardItems);
                console.log('currentItem', currentItem);
                console.log('itemType', itemType);
                // 外购页面
                console.log('----------',currentSceneId);

                if (currentSceneId==='54e369e2812011e9b9be8c8590c93956'){
                    let productsize = '';
                    let materials = '';
                    let glassPrice = '';
                    let guicost = '';
                    let CTM = '';
                    let permodulewage = '';
                    let buybatteryprice = '';
                    let inputbatprice = '';
                    let inputcomprice = '';
                    // 是否为双玻
                    let isshuangbo = false;
                    // 是否隐藏 材料组合 玻璃
                    let isdisplay = "block";


                    for (var i in dashboardItems){
                        if(dashboardItems[i].data.id==="F27BFE8193ED1C49C3DFEAB4AE4BAE82"){
                            productsize = dashboardItems[i].data.val
                        }
                    }


                    // 判断是否为双玻
                    if (productsize.indexOf('双玻')==-1){
                        // 不是双玻
                        isdisplay = "block";
                    }else{
                        // 是双玻
                        isshuangbo = true;
                        isdisplay = "none";
                    }

                    // 隐藏材料方案  玻璃价格
                    let cailiaoObj = document.getElementById('charts_76C2A9813F16D80078354A2040866EE8');
                    let cailiaoElObj = cailiaoObj.parentElement.parentElement;
                    cailiaoElObj.style.display = isdisplay;

                    let boliObj = document.getElementById('charts_02ECD9DA7A75342A7A0A79D251ADB148');
                    let boliElObj = boliObj.parentElement.parentElement;
                    boliElObj.style.display = isdisplay;

                    $http({
                        method:'GET',
                        url:'/cost/getLinkageData?productsize='+productsize,
                    }).then(function (rs) {
                        for (var i in dashboardItems){
                            if(!isshuangbo){
                                // 材料方案
                                if (dashboardItems[i].data.id==="76C2A9813F16D80078354A2040866EE8"){
                                    dashboardItems[i].data.filterDatas= rs.data.data.materials
                                    console.log(rs)
                                    dashboardItems[i].data.defaultValText = String(rs.data.data.materials[0].name)
                                    //materials = String(rs.data.data.materials[0].name)
                                }
                            }
                            //ctm
                            if (dashboardItems[i].data.id==="99A5C4C7A2EB9A8F0A165F3FC8FAC31D"){
                                dashboardItems[i].data.filterDatas= rs.data.data.ctm

                                dashboardItems[i].data.customValue = String(rs.data.data.ctm[0].name)
                                //CTM = String(rs.data.data.ctm[0].name)
                            }
                            // 组件产能利用率
                            if (dashboardItems[i].data.id==="0745E4C5BF45ED78F566CB09A6DE02F1"){
                                dashboardItems[i].data.filterDatas= rs.data.data.permodulewage
                                dashboardItems[i].data.defaultValText = String(rs.data.data.permodulewage[0].name)
                                // permodulewage = String(rs.data.data.permodulewage[0].name)
                            }
                        }


                        for (var i in dashboardItems){
                            //产品尺寸
                            if (dashboardItems[i].data.id==="F27BFE8193ED1C49C3DFEAB4AE4BAE82"){
                                productsize = dashboardItems[i].data.val
                            }
                            // 材料方案

                            if (dashboardItems[i].data.id==="76C2A9813F16D80078354A2040866EE8"){
                                materials = dashboardItems[i].data.val
                            }
                            //外购电池成本

                            if (dashboardItems[i].data.id==="083F1E0E854A5D41A9966FFCF975FC96"){
                                buybatteryprice = dashboardItems[i].data.val
                                dashboardItems[i].data.customValue = String(rs.data.data.buybatteryprice[0].name)


                            }
                            // 玻璃价格
                            if (dashboardItems[i].data.id==="02ECD9DA7A75342A7A0A79D251ADB148"){
                                glassPrice = dashboardItems[i].data.val
                            }
                            //ctm
                            if (dashboardItems[i].data.id==="99A5C4C7A2EB9A8F0A165F3FC8FAC31D"){
                                CTM = dashboardItems[i].data.val

                            }
                            //组件产能利用率
                            if (dashboardItems[i].data.id==="0745E4C5BF45ED78F566CB09A6DE02F1"){
                                permodulewage = dashboardItems[i].data.val;
                                componentcapacityuse = dashboardItems[i].data.val;
                            }
                            //组件每瓦售价
                            //A497C4CAA0B33A91C33CBB2AAEF8AF17
                            if (dashboardItems[i].data.id==="94A5DB4D55B480231D349A215B58AA11"){
                                inputcomprice = dashboardItems[i].data.val;
                            }

                        }

                        // 单多晶选择框--外购   设置对应初始值

                        if(currentItem.data.id === 'F27BFE8193ED1C49C3DFEAB4AE4BAE82'){
                            for (var i in dashboardItems){
                                if (dashboardItems[i].data.id==="76C2A9813F16D80078354A2040866EE8"){
                                    materials = dashboardItems[i].data.defaultValText
                                };
                                if (dashboardItems[i].data.id==="99A5C4C7A2EB9A8F0A165F3FC8FAC31D"){
                                    CTM = dashboardItems[i].data.customValue
                                };
                                if (dashboardItems[i].data.id==="083F1E0E854A5D41A9966FFCF975FC96"){
                                    buybatteryprice = dashboardItems[i].data.customValue
                                };

                            }

                        }
                        // 拼接发送请求,生成表格数据

                        for (var i in dashboardItems){

                            if (dashboardItems[i].data.id==="815e26e2811e11e9af6a8c8590c93956"){
                                let url = '/cost/regenerateData?productsize='+productsize+'&materials='+materials+'&glassPrice='+glassPrice+'&CTM='+CTM+'&permodulewage='+permodulewage+'&tabletype=component_out'+'&buybatteryprice='+buybatteryprice+'&componentcapacityuse='+componentcapacityuse+'&inputcomprice='+inputcomprice
                                dashboardItems[i].data.jsonconfig.data.url=url;
                                console.log(url)

                            }
                        }

                    });

                }
                // 领导自制

                else if(currentSceneId==='bf5742a686c511e9b18b8c8590c93956'){
                    var productsize = '';
                    var materials = '';
                    var glassPrice = '';
                    var guicost = '';
                    var CTM = '';
                    var permodulewage = '';
                    var prebatterywage = '';
                    var batterycapacityuse = '';
                    var componentcapacityuse ='';
                    var inputbatprice = '';
                    var inputcomprice = '';
                    // 是否为双玻
                    var isshuangbo = false;
                    // 是否隐藏 材料组合 玻璃
                    var isdisplay = "block";


                    for (var i in dashboardItems){
                        if (dashboardItems[i].data.id==="5367F8C3EF3FDB4972A659EA37BA6AE2"){
                            productsize = dashboardItems[i].data.val
                        };
                    }
                    // 判断是否为双玻
                    if (productsize.indexOf('双玻')==-1){
                        // 不是双玻
                        isdisplay = "block";
                    }else{
                        // 是双玻
                        isshuangbo = true;
                        isdisplay = "none";
                    }

                    // 隐藏材料方案  玻璃价格
                    var cailiaoObj = document.getElementById('charts_4229F9A72918589D9F81B3466D84DFA0');
                    var cailiaoElObj = cailiaoObj.parentElement.parentElement;
                    cailiaoElObj.style.display = isdisplay;

                    var boliObj = document.getElementById('charts_A741E37EDCDC8645DFB26C89B1580E02');
                    var boliElObj = boliObj.parentElement.parentElement;
                    boliElObj.style.display = isdisplay;

                    $http({
                        url: '/cost/getLinkageData?productsize='+productsize,
                        method: 'get'

                    }).then(function (rs) {
                        for (var i in dashboardItems){
                            if (dashboardItems[i].data.id==="30A83706963F5BFDC1EB6F2E54BE2430"){
                                dashboardItems[i].data.filterDatas= rs.data.data.permodulewage
                            };

                        }



                        for (var i in dashboardItems){
                            //产品尺寸
                            if (dashboardItems[i].data.id==="5367F8C3EF3FDB4972A659EA37BA6AE2"){
                                productsize = dashboardItems[i].data.val
                            };
                            //材料方案
                            if (dashboardItems[i].data.id==="4229F9A72918589D9F81B3466D84DFA0"){
                                materials = dashboardItems[i].data.val

                            };
                            //硅片价格
                            if (dashboardItems[i].data.id==="926A0FF8BC5FBF36B468BF3AF5D5B71B"){
                                guicost = dashboardItems[i].data.val
                                dashboardItems[i].data.customValue = String(rs.data.data.guicost[0].name)

                            };
                            //玻璃价格
                            if (dashboardItems[i].data.id==="A741E37EDCDC8645DFB26C89B1580E02"){
                                glassPrice = dashboardItems[i].data.val
                            };
                            // 组件产能利用率
                            if (dashboardItems[i].data.id==="30A83706963F5BFDC1EB6F2E54BE2430"){
                                permodulewage = dashboardItems[i].data.val
                                componentcapacityuse = dashboardItems[i].data.val

                            };
                            // 电池产能利用率
                            if (dashboardItems[i].data.id==="8CE9E4643B070F9D7F71698EF806FE7C"){
                                prebatterywage = dashboardItems[i].data.val
                                batterycapacityuse = dashboardItems[i].data.val
                            };
                            //电池每瓦售价
                            //DA8D956A79E3682618454F923E7E127C
                            if (dashboardItems[i].data.id==="54D67B4C6211922C81BCC94752E3F0F1"){
                                inputbatprice = dashboardItems[i].data.val;
                            }
                            //组件每瓦售价
                            //893F304DD2307BBF1CCC19F947DAE513
                            if (dashboardItems[i].data.id==="BB61A1D9C7F6461A885F1235B82B1848"){
                                inputcomprice = dashboardItems[i].data.val;
                            }

                        }

                        if(!isshuangbo){
                            for (var i in dashboardItems){
                                // 修改材料方案下拉框
                                if (dashboardItems[i].data.id==="4229F9A72918589D9F81B3466D84DFA0"){
                                    dashboardItems[i].data.filterDatas= rs.data.data.materials
                                    dashboardItems[i].data.defaultValText = String(rs.data.data.materials[0].name)


                                };

                            }
                        }


                        for (var i in dashboardItems){
                            //修改电池产能利用率
                            if (dashboardItems[i].data.id==="8CE9E4643B070F9D7F71698EF806FE7C"){
                                dashboardItems[i].data.filterDatas= rs.data.data.prebatterywage
                            };

                        }
                        // 单多晶选择框  触发修改 硅片价格  和 材料方案
                        if(currentItem.data.id == '5367F8C3EF3FDB4972A659EA37BA6AE2'){
                            for (var i in dashboardItems){
                                if (dashboardItems[i].data.id==="4229F9A72918589D9F81B3466D84DFA0"){
                                    materials = dashboardItems[i].data.defaultValText
                                };

                                if (dashboardItems[i].data.id==="926A0FF8BC5FBF36B468BF3AF5D5B71B"){
                                    guicost = dashboardItems[i].data.customValue
                                };
                            }

                        }



                        // 拼接url生成表格值

                        for (var i in dashboardItems){
                            // 电池成本计算
                            if (dashboardItems[i].data.id==="769410a89ecb11e9a7b8f40f241ab3c9"){
                                if(isshuangbo){
                                    let url = '/cost/regenerateData?productsize='+productsize+'&guicost='+guicost+'&prebatterywage='+prebatterywage+'&permodulewage='+permodulewage+'&tabletype=battery'+'&batterycapacityuse='+batterycapacityuse+'&componentcapacityuse='+componentcapacityuse+'&inputbatprice='+inputbatprice+'&inputcomprice='+inputcomprice;
                                    console.log(url);
                                    dashboardItems[i].data.jsonconfig.data.url=url;
                                }else{
                                    let url = '/cost/regenerateData?productsize='+productsize+'&materials='+materials+'&glassPrice='+glassPrice+'&guicost='+guicost+'&prebatterywage='+prebatterywage+'&permodulewage='+permodulewage+'&tabletype=battery'+'&batterycapacityuse='+batterycapacityuse+'&componentcapacityuse='+componentcapacityuse+'&inputbatprice='+inputbatprice+'&inputcomprice='+inputcomprice;
                                    console.log(url);
                                    dashboardItems[i].data.jsonconfig.data.url=url;
                                }

                            }
                            // 组件成本计算
                            if (dashboardItems[i].data.id==="ab3e5336811611e991428c8590c93956"){
                                if(isshuangbo){
                                    let url = '/cost/regenerateData?productsize='+productsize+'&guicost='+guicost+'&prebatterywage='+prebatterywage+'&permodulewage='+permodulewage+'&tabletype=component'+'&batterycapacityuse='+batterycapacityuse+'&componentcapacityuse='+componentcapacityuse+'&inputbatprice='+inputbatprice+'&inputcomprice='+inputcomprice;
                                    console.log(url);
                                    dashboardItems[i].data.jsonconfig.data.url=url;
                                }else{
                                    let url = '/cost/regenerateData?productsize='+productsize+'&materials='+materials+'&glassPrice='+glassPrice+'&guicost='+guicost+'&prebatterywage='+prebatterywage+'&permodulewage='+permodulewage+'&tabletype=component'+'&batterycapacityuse='+batterycapacityuse+'&componentcapacityuse='+componentcapacityuse+'&inputbatprice='+inputbatprice+'&inputcomprice='+inputcomprice;
                                    console.log(url);
                                    dashboardItems[i].data.jsonconfig.data.url=url;
                                }

                            }
                        }

                    });
                }
                else if(currentSceneId==="9b3acfdac33811e9a21c005056bac0e6"){
                    let superdep = '';
                    for (var i in dashboardItems){
                        if(dashboardItems[i].data.id==="513758E26B892A84ACFA61015749ED82"){
                            superdep = dashboardItems[i].data.val
                            console.log('---------',superdep)
                        }
                    }
                    $http({
                        method:'GET',
                        url:'/cost/getLinkageData?superdep='+superdep,
                    }).then(function (rs) {
                        for (var i in dashboardItems){
                            //级联子部门数据
                            if (dashboardItems[i].data.id==="826D7F55E5498B2DCCBC7BA540E97621"){
                                dashboardItems[i].data.filterDatas= rs.data.data.superdep
                                console.log(rs)
                                dashboardItems[i].data.defaultValText = String(rs.data.data.superdep[0].name)
                                dashboardItems[i].data.val = String(rs.data.data.superdep[0].name)
                            }
                        }
                    })


                }
                else {
                    console.log('hello')
                }

            }
        })
        .service('afterComponentDataLoad', function ($http, $q, $timeout) {
            this.afterTableDataLoad = function (dashboardItems, currentItem) {
                // 自制输入框颜色
                try{
                    // 电池输入
                    document.getElementById('charts_54D67B4C6211922C81BCC94752E3F0F1').style.backgroundColor='#F4A460'
                    // 组件输入
                    document.getElementById('charts_BB61A1D9C7F6461A885F1235B82B1848').style.backgroundColor='#F4A460'
                }catch (e) {

                }
                // 外购输入框颜色
                try{
                    document.getElementById('charts_94A5DB4D55B480231D349A215B58AA11').style.backgroundColor='#F4A460'
                }catch (e) {

                }

                // console.log('currentTableItem', currentItem)
                //自制电池颜色
                try{
                    battercolor = document.querySelector('#charts_769410a89ecb11e9a7b8f40f241ab3c9').querySelector('.datax-table-scroll')
                    if (battercolor) {
                        scrollRows = battercolor.querySelectorAll('.datax-table-row')
                    }
                    if (scrollRows && scrollRows.length > 0) {
                        scrollRows.forEach(function (value, index, arr) {
                            if(index==5){
                                scrollRows[index].style.backgroundColor = '#5c81ab'
                            }
                            else if (index==6){
                                scrollRows[index].style.backgroundColor = '#5c81ab'
                            }
                            else if (index==7){
                                scrollRows[index].style.backgroundColor = '#F4A460'
                            }
                        })
                    }
                }catch (e) {

                }

                //自制组件颜色
                try{
                    comcolor = document.querySelector('#charts_ab3e5336811611e991428c8590c93956').querySelector('.datax-table-scroll')
                    if (comcolor) {
                        scrollRows = comcolor.querySelectorAll('.datax-table-row')
                    }
                    if (scrollRows && scrollRows.length > 0) {
                        scrollRows.forEach(function (value, index, arr) {
                            if(index==4){
                                scrollRows[index].style.backgroundColor = '#5c81ab'
                            }
                            else if (index==5){
                                scrollRows[index].style.backgroundColor = '#5c81ab'
                            }
                            else if (index==6){
                                scrollRows[index].style.backgroundColor = '#F4A460'
                            }
                        })
                    }
                }catch (e) {

                }
                //外购颜色
                try{
                    outbuy = document.querySelector('#charts_815e26e2811e11e9af6a8c8590c93956').querySelector('.datax-table-scroll')
                    if (outbuy) {
                        scrollRows = outbuy.querySelectorAll('.datax-table-row')
                    }
                    if (scrollRows && scrollRows.length > 0) {
                        scrollRows.forEach(function (value, index, arr) {
                            if(index==4){
                                scrollRows[index].style.backgroundColor = '#5c81ab'
                            }
                            else if (index==5){
                                scrollRows[index].style.backgroundColor = '#5c81ab'
                            }
                            else if (index==6){
                                scrollRows[index].style.backgroundColor = '#F4A460'
                            }
                        })
                    }
                }catch (e) {

                }





            }
            this.afterChartDataLoad = function (dashboardItems, currentItem) {
                // console.log('currentChartItem', currentItem)
            }
        })
})()

