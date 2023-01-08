from zipit import Zipndel
from unzipit import Unzipndel


def main():
    # create instance of Zipndel and call zipit method
    zipndel = Zipndel(file_name='df', file_format='csv')
    df = pd.DataFrame({'A': [1, 2, 3], 'B': [4, 5, 6], 'C': [7, 8, 9]})
    zipndel.zipit(df)

    # create instance of Unzipndel and call unzipit method
    unzipndel = Unzipndel(file_name='df', file_format='csv')
    df = unzipndel.unzipit()


if __name__ == '__main__':
    main()
