const SHEET_ID = "1rDzVUw_iP14Mx9phaofQBzBm_wk1kkzSe1QIMDmRPuw";
const DRIVE_FOLDER_ID = "1LlqJADoKYwAmYKIvaAeXQPYhWBgBuGPE";

const LINE_USERS_SHEET = "LineUsers";
const BILLS_SHEET = "Bills";
const PAYMENTS_SHEET = "Payments";


// ================= GET =================

function doGet(e){

  try{

    if(e.parameter.action=="getBills"){

      return response({
        success:true,
        bills:getBills(e.parameter.studentId)
      });

    }


    return response({
      success:false,
      message:"No action"
    });


  }catch(err){

    return response({
      success:false,
      error:String(err)
    });

  }

}



// ================= POST =================

function doPost(e){

  try{

    Logger.log("POST START");


    const data =
    JSON.parse(e.postData.contents);


    Logger.log(JSON.stringify(data));


    // ===== PAYMENT =====

    if(data.action=="payment"){


      if(!data.slip){

        throw new Error("ไม่มี slip");

      }


      let url =
      uploadSlip(data.slip);


      Logger.log("DRIVE OK "+url);



      savePayment({

        studentId:data.studentId,

        billId:data.billId,

        slip:url

      });



      Logger.log("SHEET PAYMENT OK");



      return response({

        success:true,

        image:url

      });


    }



    // ===== SAVE LINE =====

    if(data.action=="saveLineUser"){


      saveLineUser(

        data.lineId,

        data.displayName,

        data.studentId

      );


      return response({

        success:true

      });


    }



    return response({

      success:false,

      message:"unknown"

    });



  }catch(err){

    Logger.log(err);


    return response({

      success:false,

      error:String(err)

    });

  }

}




// ================= DRIVE =================

function uploadSlip(base64){


  const folder =
  DriveApp.getFolderById(DRIVE_FOLDER_ID);



  base64 =
  base64.replace(
    /^data:image\/[^;]+;base64,/,
    ""
  );



  const blob =
  Utilities.newBlob(

    Utilities.base64Decode(base64),

    MimeType.JPEG,

    "Slip_"+Date.now()+".jpg"

  );



  const file =
  folder.createFile(blob);



  return "https://drive.google.com/uc?id="+file.getId();


}




// ================= PAYMENT SHEET =================

function savePayment(data){


  const sheet =
  SpreadsheetApp
  .openById(SHEET_ID)
  .getSheetByName(PAYMENTS_SHEET);



  sheet.appendRow([

    data.studentId,

    data.billId,

    "รอตรวจ",

    data.slip,

    new Date()

  ]);


}





// ================= LINE SHEET =================

function saveLineUser(
lineId,
name,
studentId
){


  const sheet =
  SpreadsheetApp
  .openById(SHEET_ID)
  .getSheetByName(LINE_USERS_SHEET);



  sheet.appendRow([

    lineId,

    name,

    studentId,

    new Date()

  ]);


}





// ================= BILL =================

function getBills(studentId){


  const ss =
  SpreadsheetApp.openById(SHEET_ID);


  const bills =
  ss.getSheetByName(BILLS_SHEET)
  .getDataRange()
  .getValues();


  const payments =
  ss.getSheetByName(PAYMENTS_SHEET)
  .getDataRange()
  .getValues();



  let result=[];



  for(let i=1;i<bills.length;i++){


    let status="ยังไม่จ่าย";


    for(let j=1;j<payments.length;j++){


      if(
        String(payments[j][0])==String(studentId)
        &&
        String(payments[j][1])==String(bills[i][0])
      ){

        status=payments[j][2];

      }


    }


    result.push({

      billId:bills[i][0],

      month:bills[i][1],

      title:bills[i][2],

      amount:bills[i][3],

      qr:bills[i][4],

      status:status

    });


  }


  return result;


}




// ================= RESPONSE =================

function response(obj){

  return ContentService
  .createTextOutput(
    JSON.stringify(obj)
  )
  .setMimeType(
    ContentService.MimeType.JSON
  );

}
