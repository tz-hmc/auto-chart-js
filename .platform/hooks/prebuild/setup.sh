echo "installing tools needed to build LAME"
yum update
yum install gcc gcc-c++ automake autoconf libtool yasm nasm git subversion
echo "getting the tarball"
cd /usr/local/src
wget https://sourceforge.net/projects/lame/files/lame/3.99/lame-3.99.5.tar.gz/download
tar -xvf lame-3.99.5.tar.gz
rm lame-3.99.5.tar.gz
cd lame-3.99.5
echo "installing LAME"
./configure
make
make install
echo "finished LAME install"
# service nginx reload