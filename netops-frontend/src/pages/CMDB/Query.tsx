import React, { useEffect, useRef, useState } from 'react';
import { Button, Card, Input, Space, Table, Tag, Typography, message, Row, Upload, Modal, Form, Select, Popconfirm, Col, DatePicker } from 'antd';
import type { InputRef } from 'antd';
import type { ColumnType, FilterConfirmProps, FilterDropdownProps } from 'antd/es/table/interface';
import { 
  SearchOutlined, DownloadOutlined, FilterOutlined, 
  ReloadOutlined, DatabaseOutlined, LaptopOutlined, 
  CloudServerOutlined, UploadOutlined, QuestionCircleOutlined,
  PlusOutlined, DeleteOutlined, EditOutlined
} from '@ant-design/icons';
import axios from 'axios';
import './Query.css';
import moment from 'moment';

const { Title, Text } = Typography;
const { Option } = Select;

// 设备类型标签颜色映射
const deviceTypeColors: Record<string, string> = {
  'Server': 'blue',
  'Network': 'green',
  'K8S Node': 'orange',
  'K8S Cluster': 'lime'
};

// 状态标签颜色映射
const statusColors: Record<string, string> = {
  '在线': 'green',
  '离线': 'red',
  '维护中': 'orange'
};

// 系统类型标签颜色映射
const systemTypeColors: Record<string, string> = {
  'cisco_ios': 'blue',
  'huawei_vrp': 'red',
  'ruijie_os_telnet': 'purple',
  'HPE Comware7': 'cyan',
  'cisco_nxos': 'geekblue',
  'cisco_xe': 'blue',
  'cisco_xr': 'blue',
  'huawei_vrpv8': 'red',
  'linux': 'green',
  'paloalto_panos': 'orange',
  'ruijie_os': 'purple',
  'hp_comware_telnet': 'cyan',
  'huawei_telnet': 'red',
  '其他': 'default'
};

/**
 * CMDB资产查询组件
 */
const CMDBQuery: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [assets, setAssets] = useState<any[]>([]);
  const [searchParams, setSearchParams] = useState<Record<string, any>>({});
  const searchInput = useRef<InputRef>(null);
  const [importModalVisible, setImportModalVisible] = useState<boolean>(false);
  const [csvTemplateModalVisible, setCsvTemplateModalVisible] = useState<boolean>(false);
  const [importLoading, setImportLoading] = useState<boolean>(false);
  const [systemTypes, setSystemTypes] = useState<any[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [addDeviceModalVisible, setAddDeviceModalVisible] = useState<boolean>(false);
  const [deviceTypeOptions, setDeviceTypeOptions] = useState<any[]>([]);
  const [vendorOptions, setVendorOptions] = useState<any[]>([]);
  const [statusOptions, setStatusOptions] = useState<any[]>([]);
  const [locationOptions, setLocationOptions] = useState<any[]>([]);
  const [addDeviceForm] = Form.useForm();
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);
  const [addDeviceLoading, setAddDeviceLoading] = useState<boolean>(false);
  
  // 新增编辑相关状态
  const [editDeviceModalVisible, setEditDeviceModalVisible] = useState<boolean>(false);
  const [currentDevice, setCurrentDevice] = useState<any>(null);
  const [editDeviceForm] = Form.useForm();
  const [editDeviceLoading, setEditDeviceLoading] = useState<boolean>(false);

  // 组件挂载时获取数据
  useEffect(() => {
    fetchAssets();
    fetchSystemTypes();
    fetchReferenceData();
  }, [searchParams]);

  // 获取参考数据（设备类型、厂商、状态、位置）
  const fetchReferenceData = async () => {
    try {
      const [deviceTypesRes, vendorsRes, statusesRes, locationsRes] = await Promise.all([
        axios.get('/api/cmdb/device-types'),
        axios.get('/api/cmdb/vendors'),
        axios.get('/api/cmdb/statuses'),
        axios.get('/api/cmdb/locations')
      ]);
      
      setDeviceTypeOptions(deviceTypesRes.data);
      setVendorOptions(vendorsRes.data);
      setStatusOptions(statusesRes.data);
      setLocationOptions(locationsRes.data);
    } catch (error) {
      console.error('获取参考数据失败:', error);
    }
  };

  // 获取系统类型数据
  const fetchSystemTypes = async () => {
    try {
      const response = await axios.get('/api/cmdb/system-types');
      setSystemTypes(response.data);
    } catch (error) {
      console.error('获取系统类型数据失败:', error);
    }
  };

  // 获取资产数据
  const fetchAssets = async () => {
    setLoading(true);
    try {
      // 构建查询参数
      const params = new URLSearchParams();
      Object.entries(searchParams).forEach(([key, value]) => {
        if (value) params.append(key, value.toString());
      });

      const response = await axios.get('/api/cmdb/assets', { params });
      setAssets(response.data);
    } catch (error) {
      console.error('获取资产数据失败:', error);
      message.error('获取资产数据失败');
    } finally {
      setLoading(false);
    }
  };

  // 查询资产
  const handleSearch = async () => {
    setLoading(true);
    try {
      // 移除空值
      const queryParams = Object.fromEntries(
        Object.entries(searchParams).filter(([_, v]) => v !== undefined && v !== '')
      );
      
      const response = await axios.post('/api/cmdb/assets/query', queryParams);
      setAssets(response.data);
      message.success(`查询到 ${response.data.length} 条记录`);
    } catch (error) {
      message.error('查询失败');
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  // 重置筛选
  const handleReset = () => {
    setSearchParams({});
    fetchAssets();
  };

  // 导出数据
  const handleExport = () => {
    if (assets.length === 0) {
      message.warning('没有数据可导出');
      return;
    }

    // 创建CSV内容
    const columnsWithDataIndex = columns.filter(col => col.dataIndex !== undefined && col.dataIndex !== 'actions');
    
    const headers = columnsWithDataIndex.map(col => col.title);
    
    const rows = assets.map((asset: any) => 
      columnsWithDataIndex.map(col => {
        const dataIndex = col.dataIndex as string;
        let value = '';
        
        // 处理嵌套对象
        if (dataIndex.includes('.')) {
          const parts = dataIndex.split('.');
          let obj = asset;
          for (const part of parts) {
            obj = obj?.[part];
            if (obj === undefined) break;
          }
          value = obj || '';
        } else if (typeof asset[dataIndex] === 'object' && asset[dataIndex] !== null) {
          // 处理对象类型的字段，如device_type, vendor等
          value = asset[dataIndex]?.name || '';
        } else {
          value = asset[dataIndex] || '';
        }
        
        // 如果值包含逗号，用双引号包裹
        if (String(value).includes(',')) {
          return `"${value}"`;
        }
        return String(value);
      })
    );

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // 添加BOM标记，确保Excel正确识别UTF-8编码
    const BOM = "\uFEFF";
    const csvContentWithBOM = BOM + csvContent;

    // 创建下载链接
    const blob = new Blob([csvContentWithBOM], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `资产列表_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 处理筛选确认
  const handleFilterConfirm = (field: string) => (selectedKeys: React.Key[], confirm: (param?: FilterConfirmProps) => void) => {
    setSearchParams((prev: Record<string, any>) => ({
      ...prev,
      [field]: selectedKeys[0]
    }));
    confirm();
  };

  // 处理筛选重置
  const handleFilterReset = (field: string) => (clearFilters: (() => void) | undefined) => {
    if (clearFilters) clearFilters();
    setSearchParams((prev: Record<string, any>) => {
      const newParams = { ...prev };
      delete newParams[field];
      return newParams;
    });
  };

  // 获取文本筛选下拉菜单
  const getTextFilterDropdown = (field: string) => (props: FilterDropdownProps) => {
    const { setSelectedKeys, selectedKeys, confirm, clearFilters } = props;
    return (
      <div style={{ padding: 8 }}>
        <Input
          ref={searchInput}
          placeholder={`搜索${field}`}
          value={selectedKeys[0]}
          onChange={e => setSelectedKeys(e.target.value ? [e.target.value] : [])}
          onPressEnter={() => handleFilterConfirm(field)(selectedKeys, confirm)}
          style={{ marginBottom: 8, display: 'block' }}
        />
        <Space>
          <Button
            type="primary"
            onClick={() => handleFilterConfirm(field)(selectedKeys, confirm)}
            icon={<SearchOutlined />}
            size="small"
            style={{ width: 90 }}
          >
            搜索
          </Button>
          <Button
            onClick={() => handleFilterReset(field)(clearFilters)}
            size="small"
            style={{ width: 90 }}
          >
            重置
          </Button>
        </Space>
      </div>
    );
  };

  // 获取选择筛选下拉菜单
  const getSelectFilterDropdown = (field: string, options: { text: string; value: string }[]) => (props: FilterDropdownProps) => {
    const { setSelectedKeys, selectedKeys, confirm, clearFilters } = props;
    return (
      <div style={{ padding: 8 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          {options.map(option => (
            <Button
              key={option.value}
              onClick={() => {
                setSelectedKeys([option.value]);
                handleFilterConfirm(field)([option.value], confirm);
              }}
              style={{ width: '100%', textAlign: 'left' }}
              type={selectedKeys[0] === option.value ? 'primary' : 'default'}
            >
              {option.text}
            </Button>
          ))}
          <Button
            onClick={() => handleFilterReset(field)(clearFilters)}
            size="small"
            style={{ width: '100%' }}
          >
            重置
          </Button>
        </Space>
      </div>
    );
  };

  // 筛选图标
  const getFilterIcon = (filtered: boolean) => (
    <FilterOutlined style={{ color: filtered ? '#1890ff' : undefined }} />
  );

  // 处理行选择变化
  const onSelectChange = (newSelectedRowKeys: React.Key[]) => {
    setSelectedRowKeys(newSelectedRowKeys);
  };

  // 行选择配置
  const rowSelection = {
    selectedRowKeys,
    onChange: onSelectChange,
    selections: [
      Table.SELECTION_ALL,
      Table.SELECTION_INVERT,
      Table.SELECTION_NONE,
    ],
  };

  // 处理添加设备
  const handleAddDevice = async (values: any) => {
    setAddDeviceLoading(true);
    try {
      // 处理日期字段
      const formattedValues = {
        ...values,
        purchase_date: values.purchase_date ? values.purchase_date.format('YYYY-MM-DD') : null,
        online_date: values.online_date ? values.online_date.format('YYYY-MM-DD') : null,
        warranty_expiry: values.warranty_expiry ? values.warranty_expiry.format('YYYY-MM-DD') : null,
      };
      
      await axios.post('/api/cmdb/assets', formattedValues);
      message.success('设备添加成功');
      setAddDeviceModalVisible(false);
      addDeviceForm.resetFields();
      fetchAssets(); // 刷新数据
    } catch (error) {
      console.error('添加设备失败:', error);
      message.error('添加设备失败');
    } finally {
      setAddDeviceLoading(false);
    }
  };

  // 处理删除设备
  const handleDeleteDevices = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要删除的设备');
      return;
    }

    setDeleteLoading(true);
    try {
      await axios.post('/api/cmdb/assets/delete', { ids: selectedRowKeys });
      message.success(`成功删除 ${selectedRowKeys.length} 台设备`);
      setSelectedRowKeys([]);
      fetchAssets(); // 刷新数据
    } catch (error) {
      console.error('删除设备失败:', error);
      message.error('删除设备失败');
    } finally {
      setDeleteLoading(false);
    }
  };

  // 处理编辑设备
  const handleEditDevice = async (values: any) => {
    if (!currentDevice) return;
    
    setEditDeviceLoading(true);
    try {
      // 处理日期字段
      const formattedValues = {
        ...values,
        purchase_date: values.purchase_date ? values.purchase_date.format('YYYY-MM-DD') : null,
        online_date: values.online_date ? values.online_date.format('YYYY-MM-DD') : null,
        warranty_expiry: values.warranty_expiry ? values.warranty_expiry.format('YYYY-MM-DD') : null,
      };
      
      await axios.put(`/api/cmdb/assets/${currentDevice.id}`, formattedValues);
      message.success('设备更新成功');
      setEditDeviceModalVisible(false);
      fetchAssets(); // 刷新数据
    } catch (error) {
      console.error('更新设备失败:', error);
      message.error('更新设备失败');
    } finally {
      setEditDeviceLoading(false);
    }
  };

  // 打开编辑设备模态框
  const showEditDeviceModal = (device: any) => {
    setCurrentDevice(device);
    
    // 处理日期字段，将字符串转换为moment对象
    const formValues = {
      name: device.name,
      asset_tag: device.asset_tag,
      ip_address: device.ip_address,
      serial_number: device.serial_number,
      device_type_id: device.device_type?.id,
      vendor_id: device.vendor?.id,
      department_id: device.department?.id,
      location_id: device.location?.id,
      status_id: device.status?.id,
      system_type_id: device.system_type?.id,
      owner: device.owner,
      model: device.model,
      purchase_cost: device.purchase_cost,
      current_value: device.current_value,
      notes: device.notes,
      // 日期字段处理
      purchase_date: device.purchase_date ? moment(device.purchase_date) : null,
      online_date: device.online_date ? moment(device.online_date) : null,
      warranty_expiry: device.warranty_expiry ? moment(device.warranty_expiry) : null,
    };
    
    editDeviceForm.setFieldsValue(formValues);
    setEditDeviceModalVisible(true);
  };

  // 表格列定义
  const columns: ColumnType<any>[] = [
    {
      title: '设备名称',
      dataIndex: 'name',
      key: 'name',
      filterDropdown: getTextFilterDropdown('name'),
      filterIcon: (filtered) => <FilterOutlined style={{ color: filtered ? '#1890ff' : undefined }} />,
      ellipsis: true,
      width: 150,
    },
    {
      title: '资产标签',
      dataIndex: 'asset_tag',
      key: 'asset_tag',
      filterDropdown: getTextFilterDropdown('asset_tag'),
      filterIcon: (filtered) => <FilterOutlined style={{ color: filtered ? '#1890ff' : undefined }} />,
      width: 120,
    },
    {
      title: '设备类型',
      dataIndex: 'device_type',
      key: 'device_type',
      render: (deviceType) => deviceType && (
        <Tag color={deviceTypeColors[deviceType.name] || 'default'}>
          {deviceType.name}
        </Tag>
      ),
      filterDropdown: getSelectFilterDropdown('device_type_id', [
        { text: '服务器', value: '1' },
        { text: '网络设备', value: '2' },
        { text: 'K8S节点', value: '3' },
        { text: 'K8S集群', value: '4' }
      ]),
      filterIcon: (filtered) => <FilterOutlined style={{ color: filtered ? '#1890ff' : undefined }} />,
      width: 120,
    },
    {
      title: '厂商',
      dataIndex: 'vendor',
      key: 'vendor',
      render: (vendor) => vendor && vendor.name,
      filterDropdown: getTextFilterDropdown('vendor_id'),
      filterIcon: (filtered) => <FilterOutlined style={{ color: filtered ? '#1890ff' : undefined }} />,
      width: 120,
      ellipsis: true,
    },
    {
      title: '型号',
      dataIndex: 'model',
      key: 'model',
      filterDropdown: getTextFilterDropdown('model'),
      filterIcon: (filtered) => <FilterOutlined style={{ color: filtered ? '#1890ff' : undefined }} />,
      width: 120,
      ellipsis: true,
    },
    {
      title: 'IP地址',
      dataIndex: 'ip_address',
      key: 'ip_address',
      filterDropdown: getTextFilterDropdown('ip_address'),
      filterIcon: (filtered) => <FilterOutlined style={{ color: filtered ? '#1890ff' : undefined }} />,
      width: 130,
    },
    {
      title: 'SN码',
      dataIndex: 'serial_number',
      key: 'serial_number',
      filterDropdown: getTextFilterDropdown('serial_number'),
      filterIcon: (filtered) => <FilterOutlined style={{ color: filtered ? '#1890ff' : undefined }} />,
      width: 150,
      ellipsis: true,
    },
    {
      title: '系统类型',
      dataIndex: 'system_type',
      key: 'system_type',
      render: (systemType) => systemType && (
        <Tag color={systemTypeColors[systemType.name] || 'default'}>
          {systemType.name}
        </Tag>
      ),
      filterDropdown: getSelectFilterDropdown('system_type_id', 
        systemTypes.map(st => ({ text: st.name, value: st.id.toString() }))
      ),
      filterIcon: (filtered) => <FilterOutlined style={{ color: filtered ? '#1890ff' : undefined }} />,
      width: 130,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => status && (
        <Tag color={statusColors[status.name] || 'default'}>
          {status.name}
        </Tag>
      ),
      filterDropdown: getSelectFilterDropdown('status_id', [
        { text: '在线', value: '1' },
        { text: '离线', value: '2' },
        { text: '维护中', value: '3' }
      ]),
      filterIcon: (filtered) => <FilterOutlined style={{ color: filtered ? '#1890ff' : undefined }} />,
      width: 100,
    },
    {
      title: '位置',
      dataIndex: 'location',
      key: 'location',
      render: (location) => location && location.name,
      filterDropdown: getSelectFilterDropdown('location_id', 
        locationOptions.map(location => ({ text: location.name, value: location.id.toString() }))
      ),
      filterIcon: (filtered) => <FilterOutlined style={{ color: filtered ? '#1890ff' : undefined }} />,
      width: 120,
      ellipsis: true,
    },
    {
      title: '所有者',
      dataIndex: 'owner',
      key: 'owner',
      filterDropdown: getTextFilterDropdown('owner'),
      filterIcon: (filtered) => <FilterOutlined style={{ color: filtered ? '#1890ff' : undefined }} />,
      width: 100,
      ellipsis: true,
    },
    {
      title: '上线时间',
      dataIndex: 'online_date',
      key: 'online_date',
      render: (date) => date || '-',
      width: 120,
    },
    {
      title: '购买成本',
      dataIndex: 'purchase_cost',
      key: 'purchase_cost',
      render: (cost) => cost ? `¥${cost}` : '-',
      width: 100,
    },
    {
      title: '当前价值',
      dataIndex: 'current_value',
      key: 'current_value',
      render: (value) => value ? `¥${value}` : '-',
      width: 100,
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      sorter: (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      width: 150,
    },
    {
      title: '更新时间',
      dataIndex: 'updated_at',
      key: 'updated_at',
      sorter: (a, b) => new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime(),
      width: 150,
    },
    {
      title: '操作',
      key: 'actions',
      fixed: 'right',
      width: 100,
      render: (_, record) => (
        <Space size="small">
          <Button 
            type="text" 
            icon={<EditOutlined />} 
            onClick={() => showEditDeviceModal(record)}
          />
          <Popconfirm
            title="确定要删除这台设备吗?"
            onConfirm={async () => {
              try {
                await axios.delete(`/api/cmdb/assets/${record.id}`);
                message.success('设备删除成功');
                fetchAssets(); // 刷新数据
              } catch (error) {
                console.error('删除设备失败:', error);
                message.error('删除设备失败');
              }
            }}
            okText="确定"
            cancelText="取消"
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    }
  ];

  // 根据设备类型获取图标
  const getDeviceIcon = (deviceType: string) => {
    if (!deviceType) return <DatabaseOutlined />;
    
    if (['Huawei', 'H3C', 'Ruijie', 'Cisco', 'Fortinet', 'Palo Alto'].includes(deviceType)) {
      return <DatabaseOutlined style={{ color: deviceTypeColors[deviceType as keyof typeof deviceTypeColors] || 'black' }} />;
    }
    
    if (['Physical Server', 'Virtual Machine', 'Cloud Host'].includes(deviceType)) {
      return <LaptopOutlined style={{ color: deviceTypeColors[deviceType as keyof typeof deviceTypeColors] || 'black' }} />;
    }
    
    if (deviceType === 'K8S Cluster') {
      return <CloudServerOutlined style={{ color: deviceTypeColors[deviceType as keyof typeof deviceTypeColors] || 'black' }} />;
    }
    
    return <DatabaseOutlined />;
  };

  // 处理CSV导入
  const handleImport = async (file: File) => {
    setImportLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('/api/cmdb/assets/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      message.success(`成功导入 ${response.data.imported} 条记录`);
      fetchAssets(); // 刷新数据
      setImportModalVisible(false);
    } catch (error) {
      console.error('导入失败:', error);
      message.error('导入失败，请检查CSV格式是否正确');
    } finally {
      setImportLoading(false);
    }
    
    return false; // 阻止自动上传
  };

  // CSV模板示例数据
  const csvTemplateData = `设备名称,资产标签,设备类型,厂商,型号,IP地址,SN码,系统类型,位置,所有者,所属部门,上线时间,购买成本,当前价值
Server001,SVR-001,Server,Dell,PowerEdge R740,192.168.1.101,ABCD1234,cisco_ios,机房A,张三,IT部门,2023-01-15,15000,12000
Switch001,SW-001,Network,Cisco,Catalyst 9300,192.168.1.1,XYZ9876,cisco_ios,机房B,李四,运维部门,2023-02-20,8000,7500
K8SNode001,K8S-001,K8S Node,HP,ProLiant DL380,192.168.2.101,HP12345,linux,机房A,王五,研发部门,2023-03-10,12000,11000
K8SCluster001,K8S-C001,K8S Cluster,,,192.168.3.0/24,,linux,机房C,赵六,研发部门,2023-04-05,,`;

  // 渲染筛选标签
  const renderFilterTags = () => {
    if (Object.keys(searchParams).length === 0) return null;

    return (
      <div style={{ marginBottom: 16 }}>
        {Object.entries(searchParams).map(([key, value]) => {
          let tagText = `${key}: ${value}`;
          
          // 根据不同的字段类型显示不同的标签文本
          if (key === 'device_type_id') {
            const deviceType = deviceTypeOptions.find(t => t.id.toString() === value);
            tagText = `设备类型: ${deviceType?.name || value}`;
          } else if (key === 'vendor_id') {
            const vendor = vendorOptions.find(v => v.id.toString() === value);
            tagText = `厂商: ${vendor?.name || value}`;
          } else if (key === 'system_type_id') {
            const systemType = systemTypes.find(s => s.id.toString() === value);
            tagText = `系统类型: ${systemType?.name || value}`;
          } else if (key === 'status_id') {
            const status = statusOptions.find(s => s.id.toString() === value);
            tagText = `状态: ${status?.name || value}`;
          } else if (key === 'location_id') {
            const location = locationOptions.find(l => l.id.toString() === value);
            tagText = `位置: ${location?.name || value}`;
          } else if (key === 'name') {
            tagText = `设备名称: ${value}`;
          } else if (key === 'ip_address') {
            tagText = `IP地址: ${value}`;
          } else if (key === 'asset_tag') {
            tagText = `资产标签: ${value}`;
          } else if (key === 'serial_number') {
            tagText = `SN码: ${value}`;
          } else if (key === 'model') {
            tagText = `型号: ${value}`;
          } else if (key === 'owner') {
            tagText = `所有者: ${value}`;
          }

          return (
            <Tag
              key={key}
              closable
              onClose={() => {
                setSearchParams((prev: Record<string, any>) => {
                  const newParams = { ...prev };
                  delete newParams[key];
                  return newParams;
                });
              }}
              style={{ marginRight: 8 }}
            >
              {tagText}
            </Tag>
          );
        })}
        <Button type="link" size="small" onClick={handleReset}>
          清除所有筛选
        </Button>
      </div>
    );
  };

  return (
    <div className="cmdb-query-page">
      {/* 操作按钮 */}
      <Card title="资产查询" className="cmdb-query-card">
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={24} md={12} lg={12}>
            <Space wrap>
              <Button 
                type="primary" 
                icon={<PlusOutlined />} 
                onClick={() => setAddDeviceModalVisible(true)}
              >
                添加设备
              </Button>
              <Popconfirm
                title={`确定要删除选中的 ${selectedRowKeys.length} 台设备吗?`}
                onConfirm={handleDeleteDevices}
                okText="确定"
                cancelText="取消"
                disabled={selectedRowKeys.length === 0}
              >
                <Button 
                  danger 
                  icon={<DeleteOutlined />} 
                  disabled={selectedRowKeys.length === 0}
                  loading={deleteLoading}
                >
                  删除选中 ({selectedRowKeys.length})
                </Button>
              </Popconfirm>
            </Space>
          </Col>
          <Col xs={24} sm={24} md={12} lg={12} style={{ textAlign: 'right' }}>
            <Space wrap>
              <Button 
                icon={<ReloadOutlined />} 
                onClick={handleReset}
              >
                重置
              </Button>
              <Button 
                icon={<UploadOutlined />}
                onClick={() => setImportModalVisible(true)}
              >
                导入
              </Button>
              <Button 
                type="primary" 
                icon={<DownloadOutlined />} 
                onClick={handleExport}
                disabled={assets.length === 0}
              >
                导出
              </Button>
            </Space>
          </Col>
        </Row>

        {/* 添加筛选标签显示 */}
        {renderFilterTags()}

        <Table
          rowSelection={rowSelection}
          columns={columns}
          dataSource={assets}
          rowKey="id"
          loading={loading}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
            defaultPageSize: 10,
            pageSizeOptions: ['10', '20', '50', '100'],
          }}
          scroll={{ x: 'max-content', y: 'calc(100vh - 300px)' }}
          size="middle"
          bordered
        />
      </Card>

      {/* CSV导入模态框 */}
      <Modal
        title="导入设备数据"
        open={importModalVisible}
        onCancel={() => setImportModalVisible(false)}
        footer={null}
        width={600}
      >
        <div style={{ marginBottom: 16 }}>
          <Text>请上传符合格式的CSV文件，文件大小不超过10MB。</Text>
          <Button 
            type="link" 
            icon={<QuestionCircleOutlined />}
            onClick={() => setCsvTemplateModalVisible(true)}
          >
            查看CSV模板示例
          </Button>
        </div>
        <Upload.Dragger
          name="file"
          accept=".csv"
          beforeUpload={handleImport}
          showUploadList={false}
          disabled={importLoading}
        >
          <p className="ant-upload-drag-icon">
            <UploadOutlined />
          </p>
          <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
          <p className="ant-upload-hint">支持单个CSV文件上传</p>
        </Upload.Dragger>
      </Modal>

      {/* CSV模板示例模态框 */}
      <Modal
        title="CSV模板示例"
        open={csvTemplateModalVisible}
        onCancel={() => setCsvTemplateModalVisible(false)}
        footer={[
          <Button 
            key="download" 
            type="primary" 
            onClick={() => {
              // 添加BOM标记，确保Excel正确识别UTF-8编码
              const BOM = "\uFEFF";
              const csvContentWithBOM = BOM + csvTemplateData;
              const blob = new Blob([csvContentWithBOM], { type: 'text/csv;charset=utf-8;' });
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.setAttribute('download', '设备导入模板.csv');
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
          >
            下载模板
          </Button>,
          <Button key="close" onClick={() => setCsvTemplateModalVisible(false)}>
            关闭
          </Button>
        ]}
        width={800}
      >
        <div className="csv-template-container">
          <div className="csv-template-header">
            <Text strong>CSV文件必须包含以下列（列名必须完全匹配）：</Text>
          </div>
          <Table
            dataSource={[
              { key: '设备名称', required: '是', description: '设备的唯一名称' },
              { key: '资产标签', required: '是', description: '资产的唯一标识' },
              { key: '设备类型', required: '是', description: '可选值：Server、Network、K8S Node、K8S Cluster' },
              { key: '厂商', required: '否', description: '设备制造商' },
              { key: '型号', required: '否', description: '设备型号' },
              { key: 'IP地址', required: '是', description: '设备IP地址' },
              { key: 'SN码', required: '否', description: '设备序列号' },
              { key: '系统类型', required: '是', description: '可选值：cisco_ios、huawei_vrp、ruijie_os_telnet等' },
              { key: '位置', required: '否', description: '设备所在位置' },
              { key: '所有者', required: '否', description: '设备负责人' },
              { key: '所属部门', required: '否', description: '设备所属部门' },
              { key: '上线时间', required: '否', description: '设备上线日期，格式：YYYY-MM-DD' },
              { key: '购买成本', required: '否', description: '设备购买价格' },
              { key: '当前价值', required: '否', description: '设备当前估值' }
            ]}
            columns={[
              { title: '列名', dataIndex: 'key', key: 'key' },
              { title: '是否必填', dataIndex: 'required', key: 'required' },
              { title: '说明', dataIndex: 'description', key: 'description' }
            ]}
            pagination={false}
            size="small"
          />
          <div className="csv-template-example" style={{ marginTop: 16 }}>
            <Text strong>示例数据：</Text>
            <pre style={{ 
              backgroundColor: '#f5f5f5', 
              padding: 16, 
              borderRadius: 4,
              overflowX: 'auto'
            }}>
              {csvTemplateData}
            </pre>
          </div>
        </div>
      </Modal>

      {/* 添加设备模态框 */}
      <Modal
        title="添加设备"
        open={addDeviceModalVisible}
        onCancel={() => {
          setAddDeviceModalVisible(false);
          addDeviceForm.resetFields();
        }}
        footer={null}
        width={800}
        bodyStyle={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}
      >
        <Form
          form={addDeviceForm}
          layout="vertical"
          onFinish={handleAddDevice}
        >
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="name"
                label="设备名称"
                rules={[{ required: true, message: '请输入设备名称' }]}
              >
                <Input placeholder="请输入设备名称" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="asset_tag"
                label="资产标签"
                rules={[{ required: true, message: '请输入资产标签' }]}
              >
                <Input placeholder="请输入资产标签" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="ip_address"
                label="IP地址"
                rules={[{ required: true, message: '请输入IP地址' }]}
              >
                <Input placeholder="请输入IP地址" />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="device_type_id"
                label="设备类型"
                rules={[{ required: true, message: '请选择设备类型' }]}
              >
                <Select placeholder="请选择设备类型">
                  {deviceTypeOptions.map(type => (
                    <Option key={type.id} value={type.id}>{type.name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="vendor_id"
                label="厂商"
              >
                <Select placeholder="请选择厂商" allowClear>
                  {vendorOptions.map(vendor => (
                    <Option key={vendor.id} value={vendor.id}>{vendor.name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="model"
                label="型号"
              >
                <Input placeholder="请输入设备型号" />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="serial_number"
                label="SN码"
              >
                <Input placeholder="请输入序列号" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="system_type_id"
                label="系统类型"
                rules={[{ required: true, message: '请选择系统类型' }]}
              >
                <Select placeholder="请选择系统类型">
                  {systemTypes.map(type => (
                    <Option key={type.id} value={type.id}>{type.name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="status_id"
                label="状态"
                initialValue={1} // 默认为"在线"
              >
                <Select placeholder="请选择状态">
                  {statusOptions.map(status => (
                    <Option key={status.id} value={status.id}>{status.name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="location_id"
                label="位置"
              >
                <Select placeholder="请选择位置" allowClear>
                  {locationOptions.map(location => (
                    <Option key={location.id} value={location.id}>{location.name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="owner"
                label="所有者"
              >
                <Input placeholder="请输入所有者" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="department_id"
                label="所属部门"
              >
                <Select placeholder="请选择部门" allowClear>
                  {/* 这里需要添加部门选项，如果后端有提供部门API */}
                  <Option value={1}>IT部门</Option>
                  <Option value={2}>研发部门</Option>
                  <Option value={3}>运维部门</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="purchase_date"
                label="购买日期"
              >
                <DatePicker style={{ width: '100%' }} placeholder="选择购买日期" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="online_date"
                label="上线时间"
              >
                <DatePicker style={{ width: '100%' }} placeholder="选择上线时间" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="warranty_expiry"
                label="保修到期"
              >
                <DatePicker style={{ width: '100%' }} placeholder="选择保修到期日期" />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="purchase_cost"
                label="购买成本"
              >
                <Input prefix="¥" placeholder="请输入购买成本" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="current_value"
                label="当前价值"
              >
                <Input prefix="¥" placeholder="请输入当前价值" />
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item
            name="notes"
            label="备注"
          >
            <Input.TextArea rows={4} placeholder="请输入备注信息" />
          </Form.Item>
          
          <Form.Item>
            <Row justify="end">
              <Space>
                <Button 
                  onClick={() => {
                    setAddDeviceModalVisible(false);
                    addDeviceForm.resetFields();
                  }}
                >
                  取消
                </Button>
                <Button 
                  type="primary" 
                  htmlType="submit"
                  loading={addDeviceLoading}
                >
                  添加
                </Button>
              </Space>
            </Row>
          </Form.Item>
        </Form>
      </Modal>

      {/* 编辑设备模态框 */}
      <Modal
        title="编辑设备"
        open={editDeviceModalVisible}
        onCancel={() => {
          setEditDeviceModalVisible(false);
          setCurrentDevice(null);
        }}
        footer={null}
        width={800}
        bodyStyle={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}
      >
        <Form
          form={editDeviceForm}
          layout="vertical"
          onFinish={handleEditDevice}
        >
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="name"
                label="设备名称"
                rules={[{ required: true, message: '请输入设备名称' }]}
              >
                <Input placeholder="请输入设备名称" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="asset_tag"
                label="资产标签"
                rules={[{ required: true, message: '请输入资产标签' }]}
              >
                <Input placeholder="请输入资产标签" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="ip_address"
                label="IP地址"
                rules={[{ required: true, message: '请输入IP地址' }]}
              >
                <Input placeholder="请输入IP地址" />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="device_type_id"
                label="设备类型"
                rules={[{ required: true, message: '请选择设备类型' }]}
              >
                <Select placeholder="请选择设备类型">
                  {deviceTypeOptions.map(type => (
                    <Option key={type.id} value={type.id}>{type.name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="vendor_id"
                label="厂商"
              >
                <Select placeholder="请选择厂商" allowClear>
                  {vendorOptions.map(vendor => (
                    <Option key={vendor.id} value={vendor.id}>{vendor.name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="model"
                label="型号"
              >
                <Input placeholder="请输入设备型号" />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="serial_number"
                label="序列号"
              >
                <Input placeholder="请输入序列号" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="system_type_id"
                label="系统类型"
                rules={[{ required: true, message: '请选择系统类型' }]}
              >
                <Select placeholder="请选择系统类型">
                  {systemTypes.map(type => (
                    <Option key={type.id} value={type.id}>{type.name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="status_id"
                label="状态"
              >
                <Select placeholder="请选择状态">
                  {statusOptions.map(status => (
                    <Option key={status.id} value={status.id}>{status.name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="location_id"
                label="位置"
              >
                <Select placeholder="请选择位置" allowClear>
                  {locationOptions.map(location => (
                    <Option key={location.id} value={location.id}>{location.name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="owner"
                label="所有者"
              >
                <Input placeholder="请输入所有者" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="department_id"
                label="所属部门"
              >
                <Select placeholder="请选择部门" allowClear>
                  {/* 这里需要添加部门选项，如果后端有提供部门API */}
                  <Option value={1}>IT部门</Option>
                  <Option value={2}>研发部门</Option>
                  <Option value={3}>运维部门</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="purchase_date"
                label="购买日期"
              >
                <DatePicker style={{ width: '100%' }} placeholder="选择购买日期" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="online_date"
                label="上线时间"
              >
                <DatePicker style={{ width: '100%' }} placeholder="选择上线时间" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="warranty_expiry"
                label="保修到期"
              >
                <DatePicker style={{ width: '100%' }} placeholder="选择保修到期日期" />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="purchase_cost"
                label="购买成本"
              >
                <Input prefix="¥" placeholder="请输入购买成本" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="current_value"
                label="当前价值"
              >
                <Input prefix="¥" placeholder="请输入当前价值" />
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item
            name="notes"
            label="备注"
          >
            <Input.TextArea rows={4} placeholder="请输入备注信息" />
          </Form.Item>
          
          <Form.Item>
            <Row justify="end">
              <Space>
                <Button 
                  onClick={() => {
                    setEditDeviceModalVisible(false);
                    setCurrentDevice(null);
                  }}
                >
                  取消
                </Button>
                <Button 
                  type="primary" 
                  htmlType="submit"
                  loading={editDeviceLoading}
                >
                  保存
                </Button>
              </Space>
            </Row>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CMDBQuery; 