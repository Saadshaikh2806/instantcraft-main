import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export const downloadCodeAsZip = (htmlCode, cssCode, jsCode) => {
  const zip = new JSZip();

  // Add files to zip
  zip.file("index.html", htmlCode);
  zip.file("styles.css", cssCode);
  zip.file("script.js", jsCode);

  // Generate and download zip
  zip.generateAsync({ type: "blob" })
    .then(function(content) {
      saveAs(content, "website-code.zip");
    });
}; 