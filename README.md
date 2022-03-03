### Properties (Angular Input)

<table>
    <thead>
        <tr>
            <th>Name(變數名稱)</th>
            <th>Type(型別)</th>
            <th>Default(預設值)</th>
            <th>Description(描述)</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>tmplNo</td>
            <td>Number</td>
            <td>null</td>
            <td>傳入表單樣板流水號</td>
        </tr>
        <tr>
            <td>showTag</td>
            <td>Boolean</td>
            <td>true</td>
            <td>是否要顯示表單編號、表單名稱、正式測試表單、填寫規則等TAG</td>
        </tr>
        <tr>
            <td>replyInfo</td>
            <td>FormReplyInfo</td>
            <td>null</td>
            <td>帶入填答內容，型別參照[form-master](https://gitserver.cmuh.org.tw/cmuh.modules.viewmodel/form-master/-/blob/master/src/app/form-reply-info.ts)</td>
        </tr>
        <tr>
            <td>showToolbar</td>
            <td>Boolean</td>
            <td>true</td>
            <td>是否要顯示功能列按鈕，e.g. 暫存、繳交...等按鈕</td>
        </tr>
    </tbody>
</table>

### event (Angular output)

<table>
    <thead>
        <tr>
            <th>Name(事件名稱)</th>
            <th>Parameters(回傳參數)</th>
            <th>Description(描述)</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>result</td>
            <td>event:{apiResult:Boolean,data:FormReplyInfo}</td>
            <td>回傳暫存、繳交後的api結果以及整包填答內容，型別參照[form-master](https://gitserver.cmuh.org.tw/cmuh.modules.viewmodel/form-master/-/blob/master/src/app/form-reply-info.ts)</td>
        </tr>
    </tbody>
</table>
