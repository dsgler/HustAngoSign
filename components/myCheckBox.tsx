import AntDesignIcon from '@expo/vector-icons/AntDesign';

export const MyCheckBox = ({
  isChecked,
  setIsChecked,
  size,
}: {
  isChecked: boolean;
  setIsChecked?: (isChecked: boolean) => void;
  size?: number;
}) => {
  return (
    <AntDesignIcon.Button
      name={isChecked ? 'checksquare' : 'closesquare'}
      size={size ?? 32}
      onPress={() => {
        setIsChecked?.(!isChecked);
      }}
      style={{
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
        backgroundColor: isChecked ? undefined : 'grey',
      }}
      iconStyle={{
        marginRight: 0,
      }}
    />
  );
};
