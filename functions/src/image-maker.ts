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
const D=3   //  the real parameter d
const C=10 // color_multiplier


export class ImageMaker {
  public async colorize(color:string, sourceFilePath:string, newFilePath:string) {
      // Add some color to png
      const convertArgs = [
        sourceFilePath,
        '-fill', color, '-tint', '100',
        newFilePath
      ];

      const colorConvertResult = await spawn('convert', convertArgs, { capture: [ 'stdout', 'stderr' ]})
      console.log(`[spawn convert tint ${color}] stdout:`, colorConvertResult.stdout.toString());
  }

  // this fails
  async addCaption(message:string,
                    baseName:string,
                    localInputFile:string) {
    console.log('addCaption', message);
    const newTmpFile = path.join(os.tmpdir(), baseName + '_caption.png');
    console.log('newTmpFile = ', newTmpFile)

    // There appears to be an issue with composite on Linux
    // https://unix.stackexchange.com/questions/205344/convert-composite-freezes
    // Read elsewhere that composite is a deprecated API
    // let options =
    // `${localInputFile} -bordercolor black -border 70 -background black -size 500x60 -fill white -gravity south`
    // .split(' ');
    // options.push("label:hello");
    // options.push('-composite');

    // alternate approach, also hangs
    // const options = `${localInputFile} -background black -size 500x60 -fill white label:'hello' +append`
    // .split(' ');

    // alternate approach, also hangs
    // const options = `-debug all ${localInputFile} -fill white -gravity south -draw`
    // .split(' ');
    // options.push("text 0,0 'Hello'");
    // options.push(newTmpFile);
    // console.log('options', options)


    // convert fractal.png -fill white  -gravity south -annotate 0 'hello there' out.png
    const options = `-debug all ${localInputFile} -fill white -stroke white -gravity south -annotate 0`
    .split(' ');
    options.push("hello");
    options.push(newTmpFile);
    console.log('options', options)


    let result = {};
    try {
      result = await spawn('convert', options,
      { capture: [ 'stdout', 'stderr' ]})
      console.log('result=',result);
      return newTmpFile;

    }
    catch(e) {
      console.log('addCaption exception:',e);
      console.log('result=',result);
      throw(e);
    }

  }

  public async make(options: any) {
    console.log('make options', options);
    const d = parseInt(options['d']) || D;
    const c = parseInt(options['c']) || C;
    const cre = parseFloat(options['cre']) || CRE;
    const cim = parseFloat(options['cim']) || CIM;
    const color = options['color'] || 'black'

    console.log('d=', d);

    let baseName  = `julia_c${c}_${cre}_${cim}_d${d}`;
    // avoid escaping for imagemagick
    baseName = baseName.replace(/-/g, "n");  //  - => n
    baseName = baseName.replace(/\./g, "");  // just remove .

    const tempFractasticPath = path.join(os.tmpdir(), baseName + '.ppm');
    const tempPngConvertPath = path.join(os.tmpdir(), baseName + '.png');

    try {
      // ./fractastic
      //   J [width] [height]
      //   [x_min] [x_max] [y_min] [y_max]
      //   [max_iterations]
      //   [color_multiplier]
      //   [c_re] [c_im]
      //   [d]
      const fractasticArgs = [
        'J', IMAGE_WIDTH, IMAGE_HEIGHT,
        '-2', '2', '-2', '2',
        '1000',
        String(c),
        String(cre), String(cim),
        String(d)
      ]

      console.log("Executing fractastic with ", fractasticArgs);
      const fractasticResult = await spawn(
        './fractastic/fractastic',
        fractasticArgs,
        { capture: [ 'stdout', 'stderr' ] }
      )
      console.log('fractastic completed without error');

      await new Promise((resolve, reject) => {
        const ppmStream = fs.createWriteStream(tempFractasticPath);
        ppmStream.write(fractasticResult.stdout);
        ppmStream.end();
        ppmStream.on("finish", resolve);
        ppmStream.on("error", reject);
      });

      // Convert fractastic ppm to png

      const pngConvertResult = await spawn(
        'convert',
        [ tempFractasticPath, tempPngConvertPath ],
        { capture: [ 'stdout', 'stderr' ] }
      );
      console.log('[spawn convert ppm => png] stdout:', pngConvertResult.stdout.toString());

      return {
        baseName: baseName,
        localPath: tempPngConvertPath
      };
    }
    finally {
      console.log(`Deleting ${tempFractasticPath}`)
      fs.unlinkSync(tempFractasticPath)
    }
  }
}
