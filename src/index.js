const fs = require('fs');

const componentType = {
    Button: 'General',
    Icon: 'General',
    Typography: 'General',
    Divider: 'Layout',
    Grid: 'Layout',
    Layout: 'Layout',
    Space: 'Layout',
    Affix: 'Navigation',
    Breadcrumb: 'Navigation',
    Dropdown: 'Navigation',
    Menu: 'Navigation',
    PageHeader: 'Navigation',
    Pagination: 'Navigation',
    Steps: 'Navigation',
    AutoComplete: 'Data-Entry',
    Cascader: 'Data-Entry',
    Checkbox: 'Data-Entry',
    DatePicker: 'Data-Entry',
    Form: 'Data-Entry',
    Input: 'Data-Entry',
    InputNumber: 'Data-Entry',
    Mentions: 'Data-Entry',
    Radio: 'Data-Entry',
    Rate: 'Data-Entry',
    Select: 'Data-Entry',
    Slider: 'Data-Entry',
    Switch: 'Data-Entry',
    TimePicker: 'Data-Entry',
    Transfer: 'Data-Entry',
    TreeSelect: 'Data-Entry',
    Upload: 'Data-Entry',
    Avatar: 'Data-Display',
    Badge: 'Data-Display',
    Calendar: 'Data-Display',
    Card: 'Data-Display',
    Carousel: 'Data-Display',
    Collapse: 'Data-Display',
    Comment: 'Data-Display',
    Descriptions: 'Data-Display',
    Empty: 'Data-Display',
    Image: 'Data-Display',
    List: 'Data-Display',
    Popover: 'Data-Display',
    Statistic: 'Data-Display',
    Table: 'Data-Display',
    Tabs: 'Data-Display',
    Tag: 'Data-Display',
    Timeline: 'Data-Display',
    Tooltip: 'Data-Display',
    Tree: 'Data-Display',
    Alert: 'Feedback',
    Drawer: 'Feedback',
    Message: 'Feedback',
    Modal: 'Feedback',
    Notification: 'Feedback',
    Popconfirm: 'Feedback',
    Progress: 'Feedback',
    Result: 'Feedback',
    Skeleton: 'Feedback',
    Spin: 'Feedback',
    Anchor: 'Other',
    BackTop: 'Other',
    ConfigProvider: 'Other'
}

let globalStyle = "";

/**
 * Automatically generate storybook scripts based on the sample code
 * @param {*} path 
 */
function gennerateScripts(path) {
    const components = fs.readdirSync(path); 
    components.forEach((component) => {
        
        if (!Object.keys(componentType).map(x=>x.toLowerCase()).includes(component)) {
            return;
        }
        if (!fs.existsSync(`${path}/${component}/demo`)) {
            return;
        }
        const componentDemos = fs.readdirSync(`${path}/${component}/demo`);

        componentDemos.forEach(demoMd => {
            if (!demoMd.endsWith('.md')) {
                return;
            }

            let contxt = fs.readFileSync(`${path}/${component}/demo/${demoMd}`).toString();

            // instance note
            const reg = /##\szh-CN(.*?)##\sen-US(.*?)```[j|t]sx/s;
            reg.test(contxt);
            let instanceNote = RegExp.$1 + RegExp.$2;
            instanceNote = instanceNote.replace(/\n/g, '\n * ')
            instanceNote = `/**${instanceNote}\n */`

            // instance source code
            const codeReg = /```[j|t]sx(.*?)```/s;
            codeReg.test(contxt);
            let demoCode = RegExp.$1;
        

            // instance style
            let demoStyle = "";
            if (contxt.includes('```css')) {
                const styleReg = /```css(.*?)```/s;
                styleReg.test(contxt);
                demoStyle = RegExp.$1;
                demoStyle.replace('<style>', '');
            }
            
            
            if(contxt.includes('<style>') && contxt.includes('</style>')) {
                const globalStyleReg = /\<style\>(.*?)\<\/style\>/s;
                globalStyleReg.test(contxt);
                globalStyle = `${RegExp.$1}\n${globalStyle}` ;
            }

            //  handle instance variable
            let instanceName = demoMd.replace('.md','');
            // handle start with number
            if (/^[0-9].+$/.test(instanceName)) {
                instanceName = `Demo_${instanceName}`;
            }

            // handle instance variable repeat in source code
            if (demoCode.includes(instanceName)) {
                instanceName += '_demo';
            }

            // replace single character to "_" 
            instanceName = instanceName.replace(/\W/g, '_');

            let compontName = upperCase(component);
            demoCode = editDemoCode(demoCode, 
                demoStyle, 
                instanceName, 
                instanceNote, 
                compontName
            );

            // save story script and css data
            const writeStoryPath = `${__dirname}/antd-react-v4.16.11-stories/${componentType[compontName]}/${compontName}/`;
            if(demoMd.includes('two-tone')) {
                console.log(demoStyle)
            }
            if (!fs.existsSync(writeStoryPath)) {
                fs.mkdirSync(writeStoryPath, { recursive: true });
            }
            
            fs.writeFileSync(`${writeStoryPath}${instanceName}.stories.tsx` , demoCode);
            if (demoStyle) {
                fs.writeFileSync(`${writeStoryPath}${instanceName}.css` , demoStyle);
            }
        })
        globalStyle = globalStyle.replace('.code-box-demo', '#root')
        fs.writeFileSync(`${__dirname}/antd-react-v4.16.11-stories/antd-react-v4.16.11.css` , globalStyle);
    });
}

// upperCase the first character of word
function upperCase(str) {
    return str.replace(str[0], str[0].toUpperCase())
}
  

/**
 * make the script to storybook's story script
 * @param {*} demoCode 
 * @param {*} demoStyle 
 * @param {*} instanceName 
 * @param {*} instanceNote 
 * @param {*} compontName 
 * @returns 
 */
function editDemoCode(demoCode, demoStyle, instanceName, instanceNote, compontName) {
    // import  
    if (demoStyle) {
        demoCode = `import './${instanceName}.css';\n${demoCode}`;
    }

    if (demoCode.includes(" React, ") || demoCode.includes(" React ")) {
        demoCode = `import ReactDOM from 'react-dom';\n${demoCode}`;
    } else {
        demoCode = `import React from 'react';\nimport ReactDOM from 'react-dom';\n${demoCode}`;
    }

    // Icon component special handle
    const importIcon = demoCode.match(/import (.*?) from '\@ant-design\/icons'/s);
    if (importIcon && !(importIcon[1].includes(' Icon') || importIcon[1].includes('Icon,'))) {
        demoCode = `import Icon from '@ant-design/icons';\n${demoCode}`;
    }

    // edit instance source code, return "ReactDom.render()"
    const reg = /(.*?)ReactDOM\.render\((.*?)mountNode(.*?)$/s;
    reg.test(demoCode);
    
    demoCode = `${RegExp.$1}${instanceNote}
export const ${instanceName} = () => {\n\treturn ReactDOM.render(\
${RegExp.$2.replace(/\n/g, '\n\t')}\document.getElementById('root')${RegExp.$3 ? RegExp.$3 : ')\n'}}\n\n`;

    // some components is not imported directly 
    let exportComponent = compontName;
    const importComponent = demoCode.match(/import (.*?) from 'antd'/)
    if (importComponent && !importComponent[1].includes(exportComponent)) {
        exportComponent = importComponent[1].match(/\w+/)[0];
    }

    demoCode = `${demoCode}export default {\n\t\
title: 'Ant Design/${componentType[compontName]}/${compontName}',\n\t\
component: ${exportComponent},\n\
}`;   

    return demoCode;
}

// ant-design source code path
gennerateScripts("D:\\build\\ant-design\\components");
