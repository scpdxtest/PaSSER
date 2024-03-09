import React, { Fragment } from "react";

export function formatBytes(bytes,decimals) {
    if(bytes === 0) return '0 Bytes';
    var k = 1024,
        dm = decimals || 2,
        sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
        i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

export const typeBodyTemplate = (filename) => {
  const extension = filename.toString().split('.').pop();
  switch (extension) {
      case "pdf": {
          return (
              <Fragment>
                  <i className="pi pi-file-pdf" style={{'fontSize': '1.5em', 'color': 'red'}}></i>
              </Fragment>
          );
      }
      case "doc": {
          return (
              <Fragment>
                  <i className="pi pi-file-word" style={{'fontSize': '1.5em', 'color': 'green'}}></i>
              </Fragment>
          );
      }
      case "docx": {
          return (
              <Fragment>
                  <i className="pi pi-file-word" style={{'fontSize': '1.5em', 'color': 'green'}}></i>
              </Fragment>
          );
      }
      case "xls": {
          return (
              <Fragment>
                  <i className="pi pi-file-excel" style={{'fontSize': '1.5em', 'color': 'green'}}></i>
              </Fragment>
          );
      }
      case "xlsx": {
          return (
              <Fragment>
                  <i className="pi pi-file-excel" style={{'fontSize': '1.5em', 'color': 'green'}}></i>
              </Fragment>
          );
      }
      case "csv": {
          return (
              <Fragment>
                  <i className="pi pi-file-excel" style={{'fontSize': '1.5em', 'color': 'green'}}></i>
              </Fragment>
          );
      }
      case "ppt": {
          return (
              <Fragment>
                  <i className="pi pi-file-powerpoint" style={{'fontSize': '1.5em', 'color': 'brown'}}></i>
              </Fragment>
          );
      }
      case "pptx": {
          return (
              <Fragment>
                  <i className="pi pi-file-powerpoint" style={{'fontSize': '1.5em', 'color': 'brown'}}></i>
              </Fragment>
          );
      }
      case "jpg": {
          return (
              <Fragment>
                  <i className="pi pi-image" style={{'fontSize': '1.5em', 'color': 'blue'}}></i>
              </Fragment>
          );
      }
      case "jpeg": {
          return (
              <Fragment>
                  <i className="pi pi-image" style={{'fontSize': '1.5em', 'color': 'blue'}}></i>
              </Fragment>
          );
      }
      case "png": {
          return (
              <Fragment>
                  <i className="pi pi-image" style={{'fontSize': '1.5em', 'color': 'blue'}}></i>
              </Fragment>
          );
      }
      case "gif": {
          return (
              <Fragment>
                  <i className="pi pi-image" style={{'fontSize': '1.5em', 'color': 'blue'}}></i>
              </Fragment>
          );
      }
      case "svg": {
          return (
              <Fragment>
                  <i className="pi pi-image" style={{'fontSize': '1.5em', 'color': 'blue'}}></i>
              </Fragment>
          );
      }
      case "mp4": {
          return (
              <Fragment>
                  <i className="pi pi-video" style={{'fontSize': '1.5em', 'color': 'blue'}}></i>
              </Fragment>
          );
      }
      case "mp4": {
        return (
            <Fragment>
                <i className="pi pi-video" style={{'fontSize': '1.5em', 'color': 'blue'}}></i>
            </Fragment>
        );
      }
      case "avi": {
          return (
              <Fragment>
                  <i className="pi pi-video" style={{'fontSize': '1.5em', 'color': 'blue'}}></i>
              </Fragment>
          );
      }
      case "mov": {
          return (
              <Fragment>
                  <i className="pi pi-video" style={{'fontSize': '1.5em', 'color': 'blue'}}></i>
              </Fragment>
          );
      }
      case "mpg": {
          return (
              <Fragment>
                  <i className="pi pi-video" style={{'fontSize': '1.5em', 'color': 'blue'}}></i>
              </Fragment>
          );
      }
      case "wav": {
          return (
              <Fragment>
                  <i className="pi pi-audio" style={{'fontSize': '1.5em', 'color': 'blue'}}></i>
              </Fragment>
          );
      }
      case "zip": { 
          return (
              <Fragment>
                  <i className="pi pi-file-zip" style={{'fontSize': '1.5em', 'color': 'blue'}}></i>
              </Fragment>
          );
      }
      default: {
           return (
                <Fragment>
                      <i className="pi pi-file" style={{'fontSize': '1.5em'}}></i>
                </Fragment>
           );
      }    
  }
};

export function formatDurationToMinSec(durationInSeconds) {
    const minutes = Math.floor(durationInSeconds / 60);
    const seconds = durationInSeconds % 60;

    if (minutes > 0) {
        return `${minutes} minute(s) ${seconds.toPrecision(2)} second(s)`;
    } else {
        return `${seconds} second(s)`;
    }
}

// ------------------------ font types
export const redFont = {
  color: "red",
};

export const blackFont = {
  color: "black",
};

export const blueFont = {
  color: "blue",
};

export const blueFontSmall = {
    color: "blue",
    fontSize: "12px"
  };
  
export const greenFont = {
  color: "green",
};

export const blueFontBold = {
  color: "blue",
  fontWeight: "bold"
};

export const fontBold = {
  fontWeight: "bold"
};

