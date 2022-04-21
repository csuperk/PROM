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
        <tr>
            <td>formReadOnly</td>
            <td>Boolean</td>
            <td>false</td>
            <td>formio是否唯獨(true代表唯獨)</td>
        </tr>
        <tr>
            <td>setType</td>
            <td>string<'setFormReply2' | 'addFormReply2Info'></td>
            <td>""</td>
            <td>存檔(暫存, 繳交)的類型setFormReply2是針對某個replyNo去異動, addFormReply2Info是正式表單新增時sp會自動增加replyNo</td>
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

### 用到此view的view或是webapp
<table>
    <thead>
        <tr>
            <th>類別</th>
            <th>名稱</th>
            <th>路徑</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>view</td>
            <td>form2-reply-list</td>
            <td>https://gitserver.cmuh.org.tw/cmuh.modules.view/form2-reply-list.git</td>
        </tr>
        <tr>
            <td>view</td>
            <td>form2-reply-list-subject</td>
            <td>https://gitserver.cmuh.org.tw/cmuh.modules.view/form2-reply-list-subject.git</td>
        </tr>
        <tr>
            <td>webapp</td>
            <td>form2-backend</td>
            <td>https://gitserver.cmuh.org.tw/cmuh.webapp/form2-backend.git</td>
        </tr>
        <tr>
            <td>webapp</td>
            <td>form2-replier</td>
            <td>https://gitserver.cmuh.org.tw/cmuh.webapp/form2-replier.git</td>
        </tr>
        <tr>
            <td>webapp</td>
            <td>form2-replier-public</td>
            <td>https://gitserver.cmuh.org.tw/cmuh.webapp/form2-replier-public.git</td>
        </tr>        
    </tbody>
</table>
 
