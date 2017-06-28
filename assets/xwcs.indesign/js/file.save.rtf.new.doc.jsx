const SCRIPT_NAME = 'Salva RTF';
init();
app.activeDocument.stories.everyItem().leading = Leading.AUTO;  
app.activeDocument.stories.everyItem().autoLeading = 100;  
#include "Egaf_PulisciRTF.jsx" 
{ app.activeDocument.save("D:\\Temporary.indd");
  }
init();
var rtfPath = File.saveDialog("Save Exported File As:",".rtf");
rtfPath = rtfPath;
myStory.exportFile(ExportFormat.RTF,rtfPath);
app.activeDocument.stories.everyItem().leading = Leading.AUTO;  
app.documents.item(0).close(SaveOptions.no);
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
