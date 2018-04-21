import * as Storage from '@google-cloud/storage'
import { spawn } from 'child-process-promise'
import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'

const IMAGE_WIDTH = 600;
const IMAGE_HEIGHT = 400;
const X_MIN=-2.0
const X_MAX=2.0
const Y_MIN=-2.0
const Y_MAX=2.0
// function f(z) = zd + c
const CRE=-0.4 // the real component of the complex parameter c
const CIM=0.6 // the imaginary component of the complex parameter c
const D=2   //  the real parameter d
const C=10 // color_multiplier


export class ImageMaker {
  private bucket: any;
  // TODO Accept an instance of Storage here instead the name of the bucket.
  // We can let the admin SDK automatically initialize the Storage SDK with
  // default project credentials.
  constructor(projectId: string, bucketName: string) {
    const storageConfg = {
      projectId: projectId,
      keyFilename: 'storage-credential.json'
    }

    const storage = Storage(storageConfg);

    console.log('Storate init complete');
    this.bucket = storage.bucket(bucketName);
    console.log('Storate bucket', this.bucket);
  };

  // x_min:number = X_MIN,
  // x_max:number = X_MAX

  make(options: any): Promise<Array<{ path: string, color: string }> > {
    const d = parseInt(options['d']) || 3;
    console.log('d=', d);
    const metadata = {
      contentType: 'image/png',
      // TODO: enable Client-side caching you can set the Cache-Control headers here. Uncomment below.
      // 'Cache-Control': 'public,max-age=3600',
    };

    const fileName  = `julia_${d}`;
    const tempLocalFilePng = path.join(os.tmpdir(), fileName + '.png');
    const tempLocalFilePpm = path.join(os.tmpdir(), fileName + '.ppm');
    const bucketRoot = "images"
    const destBucketPath = `${bucketRoot}/${fileName}.png`
    //const tempLocalFile = 'fractastic/examples/julia1.png';
    console.log('making', tempLocalFilePpm);

    // `${tempLocalFilePpm}`
    const pemFile = fs.createWriteStream(tempLocalFilePpm);
    const fractasticArgs = [
      'J', `${IMAGE_WIDTH}`, `${IMAGE_HEIGHT}`,
      '-2', '2', '-2', '2',
      '1000', '1',
      '-0.4', '0.6', String(d)
    ]
    let images = [{local: tempLocalFilePng,
                   bucketPath: destBucketPath,
                   color: 'black'}];
    let results = [];
    return spawn('./fractastic/fractastic', fractasticArgs,
      { capture: [ 'stdout', 'stderr' ]})
    .then((result) => {
      console.log('fractastic completed without error');
      pemFile.write(result.stdout);
      pemFile.end();
      //    convert $output_file.ppm $output_file.png
      return spawn('convert', [tempLocalFilePpm, tempLocalFilePng], { capture: [ 'stdout', 'stderr' ]})
      .then((convertResult) => {
        console.log('[spawn convert ppm => png] stdout: ', convertResult.stdout.toString());
        const newLocalFile = path.join(os.tmpdir(), `${fileName}-blue.png`);
        return spawn('convert', [tempLocalFilePng,
                                 '-fill', 'blue', '-tint', '100',
                                 newLocalFile],
                                 { capture: [ 'stdout', 'stderr' ]})
              .then((colorConvertResult) => {
                console.log('[spawn convert tint blue] stdout: ', colorConvertResult.stdout.toString());
                return {local: newLocalFile,
                        bucketPath: `${bucketRoot}/${fileName}-blue.png`,
                        color: 'blue'}
              })
      })
      .then((imageData) => {
        console.log('imageData', imageData);
        images.push(imageData);
        let uploadPromises = images.map((data) => {
          return this.bucket.upload(data.local, {destination: data.bucketPath, metadata: metadata})
                .then(() => {
                  return results.push({path: data.bucketPath, color:data.color});
                })
                .catch(function (err) {
                  console.error('[bucket.upload] err: ', err);
                });
        })
        return Promise.all(uploadPromises)
        .then(() => {
          return results;
        });
      })
    })
    .catch(function (err) {
      console.error('[spawn] err: ', err);
      console.error('[spawn] err.stderr: ', err.stderr);
      console.error('[spawn] err.stdout: ', err.stdout);
      return "there was an error"
    });
  }
}
