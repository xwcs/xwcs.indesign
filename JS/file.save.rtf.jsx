const SCRIPT_NAME = 'Salva RTF';
var err = 0,
	errMsg = '',
	myStory;
	
app.activeDocument.stories.everyItem().leading = Leading.AUTO;  
app.activeDocument.stories.everyItem().autoLeading = 100; 
app.activeDocument.stories.everyItem().leading = Leading.AUTO;  
#include "Egaf_PulisciRTF.jsx" 
{ app.activeDocument.save("D:\\Temporary.indd");
  }
try{
	init();
	if (myStory){
		var rtfPath = myStory.label
			rtfFile = new File(rtfPath);;
		if(rtfFile.exists){
			var p = app.pdfExportPresets.firstItem();
			myStory.exportFile(ExportFormat.RTF,rtfFile,false,p,'',true);
		}else{
			err = -43;
			errMsg = 'L\'etichetta del brano non contiene un percorso valido per il file RTF da salvare.';
		}
	}else{
		err = -43;
		errMsg = 'Non ci sono documenti aperti o il documento attivo non ha frame nella prima pagina.';
	}
}catch(e){
	err = e.number;
	errMsg = e.description;
}finally{
	if(err != '')alert ('Si è verificato l\'errore n°'+err+'.\r'+errMsg, SCRIPT_NAME);
}

{ app.documents.item(0).close(SaveOptions.no);
}

function init(){
	var myDocument,
		myPage,
		myTextFrame,
		myDocument = app.activeDocument;
	if(myDocument){
		myPage = myDocument.pages.item(0);
		if(myPage.textFrames.length>0){
			myTextFrame = myPage.textFrames.item(0);
			myStory = myTextFrame.parentStory;
		}
	}	
}

