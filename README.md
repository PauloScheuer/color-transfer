# color-transfer
Color transfer from a colorized image to a black and white one

## How to use:

- Select a colorized image to use as a source;
- Select a greyscale image to use as a target;
- Remember that in order to achieve a good result both images must have a similar structure;
- Click the transfer button and see the result!

## How it works:

This program uses the algorithm described by Tomihisa Welsh, Michael Ashikhmin and Klaus Mueller in their paper "Transferring Color to Greyscale Images". The algorithm works in a few steps:

- At first, both images are converted to the Lab image space, in order to separe the luminance information (L) from the color one (a and b);
- Then, a luminance histogram matching is performed, making the luminance of the source image more similar to the luminance of the target image;
- The next step is to collect a set of samples from the source image. For that, 200 samples are taken using a jittered grid;
- The samples are then matched with each pixel of the target image according to some informations such as the luminance and the luminance standard deviation of the neighbourhood of the pixel;
- To finalize, only the a and b informations are transfered to the target image, preserving its original luminance.
